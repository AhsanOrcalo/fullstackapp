import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus, PaymentMethod } from './payment.schema';
import { CryptomusService, CryptomusPaymentRequest } from './cryptomus.service';
import { LeadsService } from '../leads/leads.service';
import { UsersService } from '../users/users.service';
import { PurchasesService } from '../purchases/purchases.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    private cryptomusService: CryptomusService,
    private leadsService: LeadsService,
    private usersService: UsersService,
    private purchasesService: PurchasesService,
  ) {}

  /**
   * Create a payment for adding funds or purchasing a lead
   */
  async createPayment(userId: string, createPaymentDto: CreatePaymentDto) {
    const { amount, currency = 'USD', paymentMethod = PaymentMethod.CRYPTOMUS, leadId, additionalData } = createPaymentDto;

    // If purchasing a lead, validate it exists and is available
    if (leadId) {
      const lead = await this.leadsService.getLeadById(leadId);
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      const leadPrice = parseFloat(lead.price?.toString() || '0');
      if (Math.abs(amount - leadPrice) > 0.01) {
        throw new BadRequestException(`Payment amount must match lead price: $${leadPrice.toFixed(2)}`);
      }
    }

    // Create payment record
    const payment = new this.paymentModel({
      userId: new Types.ObjectId(userId),
      amount,
      currency,
      paymentMethod,
      status: PaymentStatus.PENDING,
      cryptomusAdditionalData: additionalData,
    });

    // If using Cryptomus, create payment invoice
    if (paymentMethod === PaymentMethod.CRYPTOMUS) {
      try {
        const orderId = payment._id.toString();
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        
        const cryptomusRequest: CryptomusPaymentRequest = {
          amount: amount.toString(),
          currency: currency,
          orderId: orderId,
          urlReturn: `${baseUrl}/payment/return`,
          urlSuccess: `${baseUrl}/payment/success`,
          urlCallback: `${process.env.BACKEND_URL || 'http://localhost:8000'}/payments/webhook`,
          isPaymentMultiple: false,
          lifetime: 7200, // 2 hours
          toCurrency: currency,
          additionalData: additionalData || (leadId ? `Lead purchase: ${leadId}` : 'Account top-up'),
        };

        const cryptomusResponse = await this.cryptomusService.createPayment(cryptomusRequest);

        // Update payment with Cryptomus data
        payment.cryptomusOrderId = orderId;
        payment.cryptomusUuid = cryptomusResponse.result.uuid;
        payment.cryptomusAddress = cryptomusResponse.result.address;
        payment.cryptomusNetwork = cryptomusResponse.result.network;
        payment.cryptomusCurrency = cryptomusResponse.result.currency;
        payment.cryptomusPaymentUrl = cryptomusResponse.result.url;
        payment.cryptomusExpiredAt = new Date(cryptomusResponse.result.expiredAt * 1000);
        payment.cryptomusResponse = cryptomusResponse.result;
        payment.status = PaymentStatus.PROCESSING;

        await payment.save();

        return {
          paymentId: payment._id.toString(),
          paymentUrl: cryptomusResponse.result.url,
          uuid: cryptomusResponse.result.uuid,
          address: cryptomusResponse.result.address,
          network: cryptomusResponse.result.network,
          currency: cryptomusResponse.result.currency,
          amount: cryptomusResponse.result.amount,
          paymentAmount: cryptomusResponse.result.paymentAmount,
          paymentAmountUsd: cryptomusResponse.result.paymentAmountUsd,
          expiredAt: cryptomusResponse.result.expiredAt,
          qrCode: cryptomusResponse.result.url, // Cryptomus provides QR code in the URL
        };
      } catch (error: any) {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = error.message;
        await payment.save();
        throw error;
      }
    } else {
      // Balance payment (immediate)
      await payment.save();
      return {
        paymentId: payment._id.toString(),
        status: payment.status,
      };
    }
  }

  /**
   * Handle Cryptomus webhook
   */
  async handleWebhook(webhookData: any, signature: string) {
    // Verify signature
    const isValid = this.cryptomusService.verifyWebhookSignature(webhookData, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { order_id, uuid, payment_status, status, is_final, txid } = webhookData;

    // Find payment by order ID
    const payment = await this.paymentModel.findOne({ _id: order_id });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    payment.cryptomusTxid = txid;
    payment.cryptomusResponse = webhookData;

    if (is_final) {
      if (status === 'paid' || payment_status === 'paid') {
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();

        // If this is for a lead purchase, create the purchase
        if (payment.cryptomusAdditionalData?.includes('Lead purchase:')) {
          const leadIdMatch = payment.cryptomusAdditionalData.match(/Lead purchase: (\w+)/);
          if (leadIdMatch && leadIdMatch[1]) {
            try {
              // Add funds to user balance first
              const user = await this.usersService.findOneById(payment.userId.toString());
              if (user) {
                const currentBalance = parseFloat(user.balance?.toString() || '0');
                user.balance = currentBalance + payment.amount;
                await user.save();
              }

              // Create purchase
              const purchaseResult = await this.purchasesService.purchaseLead(
                payment.userId.toString(),
                leadIdMatch[1],
              );

              // Link purchase to payment
              const purchaseDoc = purchaseResult.purchase as any;
              payment.purchaseId = new Types.ObjectId(purchaseDoc._id || purchaseDoc.id);
            } catch (error: any) {
              // Log error but don't fail the webhook
              console.error('Error creating purchase from payment:', error);
            }
          }
        } else {
          // Add funds to user balance
          const user = await this.usersService.findOneById(payment.userId.toString());
          if (user) {
            const currentBalance = parseFloat(user.balance?.toString() || '0');
            user.balance = currentBalance + payment.amount;
            await user.save();
          }
        }
      } else if (status === 'fail' || payment_status === 'fail') {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = webhookData.message || 'Payment failed';
      } else if (status === 'expired' || payment_status === 'expired') {
        payment.status = PaymentStatus.EXPIRED;
      }
    } else {
      payment.status = PaymentStatus.PROCESSING;
    }

    await payment.save();

    return {
      success: true,
      paymentId: payment._id.toString(),
      status: payment.status,
    };
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await this.paymentModel.findOne({
      _id: paymentId,
      userId: new Types.ObjectId(userId),
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // If using Cryptomus and payment is still processing, check status
    if (payment.paymentMethod === PaymentMethod.CRYPTOMUS && payment.cryptomusUuid) {
      if (payment.status === PaymentStatus.PROCESSING || payment.status === PaymentStatus.PENDING) {
        try {
          const cryptomusStatus = await this.cryptomusService.getPaymentStatus(payment.cryptomusUuid);
          
          // Update payment if status changed
          if (cryptomusStatus.result.isFinal) {
            if (cryptomusStatus.result.status === 'paid') {
              payment.status = PaymentStatus.PAID;
              payment.paidAt = new Date();
              await payment.save();
            } else if (cryptomusStatus.result.status === 'fail') {
              payment.status = PaymentStatus.FAILED;
              await payment.save();
            } else if (cryptomusStatus.result.status === 'expired') {
              payment.status = PaymentStatus.EXPIRED;
              await payment.save();
            }
          }
        } catch (error) {
          // Log but don't fail
          console.error('Error checking Cryptomus payment status:', error);
        }
      }
    }

    return payment;
  }

  /**
   * Get user payments
   */
  async getUserPayments(userId: string) {
    return this.paymentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}

