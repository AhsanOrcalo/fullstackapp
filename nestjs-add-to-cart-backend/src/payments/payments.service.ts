import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus, PaymentMethod } from './payment.schema';
import { NowPaymentsService, NowPaymentsPaymentRequest } from './nowpayments.service';
import { LeadsService } from '../leads/leads.service';
import { UsersService } from '../users/users.service';
import { PurchasesService } from '../purchases/purchases.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    private nowpaymentsService: NowPaymentsService,
    private leadsService: LeadsService,
    private usersService: UsersService,
    private purchasesService: PurchasesService,
  ) {}

  /**
   * Create a payment for adding funds or purchasing a lead
   */
  async createPayment(userId: string, createPaymentDto: CreatePaymentDto) {
    const { amount, currency = 'USD', paymentMethod = PaymentMethod.NOWPAYMENTS, leadId, additionalData } = createPaymentDto;

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
      nowpaymentsOrderDescription: additionalData || (leadId ? `Lead purchase: ${leadId}` : 'Account top-up'),
    });

    // If using NOWPayments, create payment invoice
    if (paymentMethod === PaymentMethod.NOWPAYMENTS) {
      try {
        const orderId = payment._id.toString();
        const baseUrl = 'https://freshdata.shop/api'; 
        const frontendUrl = 'https://freshdata.shop';
        
        const nowpaymentsRequest: NowPaymentsPaymentRequest = {
          price_amount: amount,
          price_currency: currency,
          order_id: orderId,
          order_description: additionalData || (leadId ? `Lead purchase: ${leadId}` : 'Account top-up'),
          ipn_callback_url: `${baseUrl}/payments/webhook`,
          success_url: `${frontendUrl}/payment-success`,
          cancel_url: `${frontendUrl}/payment-failed`,
        };

        const nowpaymentsResponse = await this.nowpaymentsService.createPayment(nowpaymentsRequest);

        // Update payment with NOWPayments data
        payment.nowpaymentsPaymentId = nowpaymentsResponse.payment_id;
        payment.nowpaymentsPayAddress = nowpaymentsResponse.pay_address;
        payment.nowpaymentsPayCurrency = nowpaymentsResponse.pay_currency;
        payment.nowpaymentsPriceCurrency = nowpaymentsResponse.price_currency;
        payment.nowpaymentsPurchaseId = nowpaymentsResponse.purchase_id;
        payment.nowpaymentsOrderId = nowpaymentsResponse.order_id;
        payment.nowpaymentsOrderDescription = nowpaymentsResponse.order_description;
        payment.nowpaymentsResponse = nowpaymentsResponse;
        if (nowpaymentsResponse.expiration_estimate_date) {
          payment.nowpaymentsExpiredAt = new Date(nowpaymentsResponse.expiration_estimate_date);
        }
        payment.status = PaymentStatus.PROCESSING;

        await payment.save();

        // Build payment URL (NOWPayments typically provides this in the response or we construct it)
        const paymentUrl = `https://nowpayments.io/payment/?iid=${nowpaymentsResponse.payment_id}`;

        return {
          paymentId: payment._id.toString(),
          paymentUrl: paymentUrl,
          payment_id: nowpaymentsResponse.payment_id,
          address: nowpaymentsResponse.pay_address,
          currency: nowpaymentsResponse.pay_currency,
          amount: nowpaymentsResponse.pay_amount,
          priceAmount: nowpaymentsResponse.price_amount,
          priceCurrency: nowpaymentsResponse.price_currency,
          expiredAt: nowpaymentsResponse.expiration_estimate_date ? new Date(nowpaymentsResponse.expiration_estimate_date).getTime() / 1000 : null,
          qrCode: paymentUrl,
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
   * Handle webhook (NOWPayments)
   */
  async handleWebhook(webhookData: any, signature?: string) {
    // NOWPayments webhook
    const isValid = this.nowpaymentsService.verifyWebhookSignature(webhookData, signature || '');
    if (!isValid) {
      throw new BadRequestException('Invalid NOWPayments webhook signature');
    }

    const { payment_id, order_id, payment_status } = webhookData;

    // Find payment by order ID or payment ID
    const payment = await this.paymentModel.findOne({
      $or: [
        { _id: order_id },
        { nowpaymentsPaymentId: payment_id },
        { nowpaymentsOrderId: order_id },
      ],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment with webhook data
    payment.nowpaymentsPaymentId = payment_id || payment.nowpaymentsPaymentId;
    payment.nowpaymentsResponse = webhookData;

    // NOWPayments status: 'waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired'
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();

      // If this is for a lead purchase, create the purchase
      if (payment.nowpaymentsOrderDescription && payment.nowpaymentsOrderDescription.includes('Lead purchase:')) {
        const leadIdMatch = payment.nowpaymentsOrderDescription.match(/Lead purchase: (\w+)/);
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
            console.error('Error creating purchase from payment:', error);
          }
        }
      } else {
        // Add funds to user balance (for account top-up)
        const user = await this.usersService.findOneById(payment.userId.toString());
        if (user) {
          const currentBalance = parseFloat(user.balance?.toString() || '0');
          user.balance = currentBalance + payment.amount;
          await user.save();
        }
      }
    } else if (payment_status === 'failed' || payment_status === 'refunded') {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = webhookData.payment_status || 'Payment failed';
    } else if (payment_status === 'expired') {
      payment.status = PaymentStatus.EXPIRED;
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

    // If using NOWPayments and payment is still processing, check status
    if (payment.paymentMethod === PaymentMethod.NOWPAYMENTS && payment.nowpaymentsPaymentId) {
      if (payment.status === PaymentStatus.PROCESSING || payment.status === PaymentStatus.PENDING) {
        try {
          const nowpaymentsStatus = await this.nowpaymentsService.getPaymentStatus(payment.nowpaymentsPaymentId);
          
          // Update payment if status changed
          if (nowpaymentsStatus.payment_status === 'finished' || nowpaymentsStatus.payment_status === 'confirmed') {
            payment.status = PaymentStatus.PAID;
            payment.paidAt = new Date();
            await payment.save();
          } else if (nowpaymentsStatus.payment_status === 'failed' || nowpaymentsStatus.payment_status === 'refunded') {
            payment.status = PaymentStatus.FAILED;
            await payment.save();
          } else if (nowpaymentsStatus.payment_status === 'expired') {
            payment.status = PaymentStatus.EXPIRED;
            await payment.save();
          }
        } catch (error) {
          // Log but don't fail
          console.error('Error checking NOWPayments payment status:', error);
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

