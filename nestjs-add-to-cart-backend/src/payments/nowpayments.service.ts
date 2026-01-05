import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface NowPaymentsPaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface NowPaymentsPaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  ipn_callback_url?: string;
  ipn_currency?: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: string;
  payment_extra_id?: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: string;
  expiration_estimate_date?: string;
  is_fixed_rate?: boolean;
  is_fee_paid_by_user?: boolean;
  valid_until?: string;
  type?: string;
}

export interface NowPaymentsWebhookData {
  payment_id: number;
  invoice_id?: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: string;
  payin_extra_id?: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: string;
  expiration_estimate_date?: string;
  payment_extra_id?: string;
  [key: string]: any; // Allow additional fields from NOWPayments
}

@Injectable()
export class NowPaymentsService {
  private readonly logger = new Logger(NowPaymentsService.name);
  private readonly apiClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly ipnSecretKey: string;
  private readonly baseUrl = 'https://api.nowpayments.io/v1';

  constructor() {
    this.apiKey = process.env.NOWPAYMENTS_API_KEY || '';
    this.ipnSecretKey = process.env.NOWPAYMENTS_IPN_SECRET_KEY || '';

    if (!this.apiKey) {
      this.logger.warn('NOWPayments API key not configured. Payment features will be disabled.');
    }

    if (!this.ipnSecretKey) {
      this.logger.warn('NOWPayments IPN secret key not configured. Webhook verification will be disabled.');
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Verify webhook signature using HMAC SHA512
   * NOWPayments uses HMAC SHA512 with the IPN secret key
   */
  verifyWebhookSignature(data: any, signature: string): boolean {
    if (!this.ipnSecretKey) {
      this.logger.warn('IPN secret key not configured, skipping signature verification');
      return true; // In development, you might want to return false
    }

    try {
      // Create a sorted string from the data
      const sortedData = JSON.stringify(data, Object.keys(data).sort());
      
      // Create HMAC SHA512 hash
      const hmac = crypto.createHmac('sha512', this.ipnSecretKey);
      hmac.update(sortedData);
      const calculatedSignature = hmac.digest('hex');

      // Compare signatures
      return calculatedSignature === signature;
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Create a payment invoice
   */
  async createPayment(paymentData: NowPaymentsPaymentRequest): Promise<NowPaymentsPaymentResponse> {
    if (!this.apiKey) {
      throw new BadRequestException('NOWPayments payment gateway is not configured');
    }

    try {
      this.logger.log('Creating NOWPayments payment', { 
        order_id: paymentData.order_id,
        price_amount: paymentData.price_amount,
        price_currency: paymentData.price_currency
      });

      const response = await this.apiClient.post<NowPaymentsPaymentResponse>(
        '/payment',
        paymentData,
      );

      this.logger.log('NOWPayments API response received', { 
        payment_id: response.data.payment_id,
        payment_status: response.data.payment_status 
      });

      return response.data;
    } catch (error: any) {
      this.logger.error('Error creating NOWPayments payment', error);
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || error.message;
        throw new BadRequestException(`NOWPayments API error: ${errorMessage}`);
      }
      throw new BadRequestException(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: number): Promise<NowPaymentsPaymentResponse> {
    if (!this.apiKey) {
      throw new BadRequestException('NOWPayments payment gateway is not configured');
    }

    try {
      const response = await this.apiClient.get<NowPaymentsPaymentResponse>(
        `/payment/${paymentId}`,
      );

      if (response.data) {
        return response.data;
      }

      throw new BadRequestException(`NOWPayments API error: Payment not found`);
    } catch (error: any) {
      this.logger.error('Error getting NOWPayments payment status', error);
      if (error.response) {
        throw new BadRequestException(
          `NOWPayments API error: ${error.response.data?.message || error.message}`,
        );
      }
      throw new BadRequestException(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Get available currencies
   */
  async getCurrencies(): Promise<any> {
    if (!this.apiKey) {
      throw new BadRequestException('NOWPayments payment gateway is not configured');
    }

    try {
      const response = await this.apiClient.get('/currencies');
      return response.data;
    } catch (error: any) {
      this.logger.error('Error getting NOWPayments currencies', error);
      throw new BadRequestException(
        `NOWPayments API error: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

