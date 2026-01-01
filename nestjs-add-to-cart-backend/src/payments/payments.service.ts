import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus, PaymentMethod } from './payment.schema';
import { CryptomusService, CryptomusPaymentRequest } from './cryptomus.service';
import { PlisioService, PlisioPaymentRequest } from './plisio.service';
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
    private plisioService: PlisioService,
    private leadsService: LeadsService,
    private usersService: UsersService,
    private purchasesService: PurchasesService,
  ) {}

  /**
   * Create a payment for adding funds or purchasing a lead
   */
  async createPayment(userId: string, createPaymentDto: CreatePaymentDto) {
    const { amount, currency = 'USD', paymentMethod = PaymentMethod.PLISIO, leadId, additionalData } = createPaymentDto;

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

    // If using Plisio, create payment invoice
    if (paymentMethod === PaymentMethod.PLISIO) {
      try {
        const orderId = payment._id.toString();
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        
        // Get URLs from environment variables or use defaults
        const statusUrl = process.env.PLISIO_STATUS_URL || `${process.env.BACKEND_URL || 'http://localhost:8000'}/payments/webhook`;
        const successUrl = process.env.PLISIO_SUCCESS_URL || `${baseUrl}/payment/success`;
        const failUrl = process.env.PLISIO_FAIL_URL || `${baseUrl}/payment/fail`;
        
        const plisioRequest: PlisioPaymentRequest = {
          amount: amount,
          currency: currency,
          order_number: orderId,
          order_name: leadId ? `Lead purchase: ${leadId}` : 'Account top-up',
          description: additionalData || (leadId ? `Lead purchase: ${leadId}` : 'Account top-up'),
          callback_url: statusUrl, // Status URL (webhook) - Plisio uses callback_url for webhook
          success_url: successUrl,
          fail_url: failUrl,
        };

        const plisioResponse = await this.plisioService.createPayment(plisioRequest);

        // Update payment with Plisio data
        payment.plisioTxnId = plisioResponse.data.txn_id;
        payment.plisioInvoiceId = plisioResponse.data.invoice_id;
        payment.plisioAddress = plisioResponse.data.address;
        payment.plisioCurrency = plisioResponse.data.currency;
        payment.plisioPaymentUrl = plisioResponse.data.invoice_url;
        if (plisioResponse.data.expires_at) {
          payment.plisioExpiredAt = new Date(plisioResponse.data.expires_at * 1000);
        }
        payment.plisioOrderNumber = orderId;
        payment.plisioResponse = plisioResponse.data;
        payment.status = PaymentStatus.PROCESSING;

        await payment.save();

        return {
          paymentId: payment._id.toString(),
          paymentUrl: plisioResponse.data.invoice_url,
          txnId: plisioResponse.data.txn_id,
          invoiceId: plisioResponse.data.invoice_id,
          address: plisioResponse.data.address,
          currency: plisioResponse.data.currency,
          amount: plisioResponse.data.amount,
          expiredAt: plisioResponse.data.expires_at,
          qrCode: plisioResponse.data.invoice_url,
        };
      } catch (error: any) {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = error.message;
        await payment.save();
        throw error;
      }
    }
    // If using Cryptomus, create payment invoice (kept for backward compatibility)
    else if (paymentMethod === PaymentMethod.CRYPTOMUS) {
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
   * Handle webhook (Plisio or Cryptomus)
   */
  async handleWebhook(webhookData: any, signature?: string) {
    // Determine which gateway based on webhook data structure
    const isPlisio = webhookData.txn_id || webhookData.invoice_id;
    const isCryptomus = webhookData.order_id || webhookData.uuid;

    let payment;

    if (isPlisio) {
      // Plisio webhook
      const { verify_hash, ...payloadData } = webhookData;
      const isValid = this.plisioService.verifyWebhookSignature(payloadData, verify_hash || signature || '');
      if (!isValid) {
        throw new BadRequestException('Invalid Plisio webhook signature');
      }

      const { txn_id, invoice_id, order_number, status } = webhookData;

      // Find payment by order number or invoice ID
      payment = await this.paymentModel.findOne({
        $or: [
          { _id: order_number },
          { plisioInvoiceId: invoice_id },
          { plisioTxnId: txn_id },
        ],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Update payment status
      payment.plisioTxnId = txn_id;
      payment.plisioResponse = webhookData;

      // Plisio status: 'new', 'pending', 'pending_internal', 'mismatch', 'expired', 'cancel', 'fail', 'psys_cancel', 'psys_fail', 'confirm_check', 'paid', 'psys_paid'
      if (status === 'paid' || status === 'psys_paid') {
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();

        // If this is for a lead purchase, create the purchase
        if (payment.plisioOrderNumber && payment.plisioOrderNumber.includes('Lead purchase:')) {
          const leadIdMatch = payment.plisioOrderNumber.match(/Lead purchase: (\w+)/);
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
          // Add funds to user balance
          const user = await this.usersService.findOneById(payment.userId.toString());
          if (user) {
            const currentBalance = parseFloat(user.balance?.toString() || '0');
            user.balance = currentBalance + payment.amount;
            await user.save();
          }
        }
      } else if (status === 'fail' || status === 'psys_fail' || status === 'cancel' || status === 'psys_cancel') {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = webhookData.status || 'Payment failed';
      } else if (status === 'expired') {
        payment.status = PaymentStatus.EXPIRED;
      } else {
        payment.status = PaymentStatus.PROCESSING;
      }
    } else if (isCryptomus) {
      // Cryptomus webhook (backward compatibility)
      const isValid = this.cryptomusService.verifyWebhookSignature(webhookData, signature || '');
      if (!isValid) {
        throw new BadRequestException('Invalid Cryptomus webhook signature');
      }

      const { order_id, uuid, payment_status, status, is_final, txid } = webhookData;

      // Find payment by order ID
      payment = await this.paymentModel.findOne({ _id: order_id });
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

    // If using Plisio and payment is still processing, check status
    if (payment.paymentMethod === PaymentMethod.PLISIO && payment.plisioTxnId) {
      if (payment.status === PaymentStatus.PROCESSING || payment.status === PaymentStatus.PENDING) {
        try {
          const plisioStatus = await this.plisioService.getPaymentStatus(payment.plisioTxnId);
          
          // Update payment if status changed
          // Note: Plisio status checking may require additional API calls
          // For now, we'll rely on webhook for status updates
          // The webhook handler will update the payment status when payment is completed
        } catch (error) {
          // Log but don't fail
          console.error('Error checking Plisio payment status:', error);
        }
      }
    }
    // If using Cryptomus and payment is still processing, check status (backward compatibility)
    else if (payment.paymentMethod === PaymentMethod.CRYPTOMUS && payment.cryptomusUuid) {
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

