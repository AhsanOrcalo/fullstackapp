import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface CryptomusPaymentRequest {
  amount: string;
  currency: string;
  orderId: string;
  urlReturn?: string;
  urlSuccess?: string;
  urlCallback?: string;
  isPaymentMultiple?: boolean;
  lifetime?: number;
  toCurrency?: string;
  subtract?: number;
  accuracy?: number;
  additionalData?: string;
  currencies?: string[];
  exceptCurrencies?: string[];
  network?: string;
  address?: string;
  isRefund?: boolean;
}

export interface CryptomusPaymentResponse {
  state: number;
  result: {
    uuid: string;
    orderId: string;
    amount: string;
    paymentAmount: string;
    paymentAmountUsd: string;
    currency: string;
    network: string;
    address: string;
    from: string;
    txid: string;
    paymentStatus: string;
    url: string;
    expiredAt: number;
    status: string;
    isFinal: boolean;
    additionalData?: string;
    currencies?: any;
  };
}

export interface CryptomusWebhookData {
  order_id: string;
  uuid: string;
  amount: string;
  payment_amount: string;
  payment_amount_usd: string;
  currency: string;
  network: string;
  address: string;
  from: string;
  txid: string;
  payment_status: string;
  url: string;
  expired_at: number;
  status: string;
  is_final: boolean;
  additional_data?: string;
  currencies?: any;
}

@Injectable()
export class CryptomusService {
  private readonly logger = new Logger(CryptomusService.name);
  private readonly apiClient: AxiosInstance;
  private readonly merchantId: string;
  private readonly paymentApiKey: string;
  private readonly baseUrl = 'https://api.cryptomus.com/v1';

  constructor() {
    // this.merchantId = process.env.CRYPTOMUS_MERCHANT_ID || '';
    this.merchantId = "186b5289-c445-4b02-97cf-b6d516a32195";

    this.paymentApiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY || '';

    if (!this.merchantId || !this.paymentApiKey) {
      this.logger.warn('Cryptomus credentials not configured. Payment features will be disabled.');
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate signature for Cryptomus API requests
   */
  private generateSignature(payload: string): string {
    const sign = crypto
      .createHash('md5')
      .update(Buffer.from(payload).toString('base64') + this.paymentApiKey)
      .digest('hex');
    return sign;
  }

  /**
   * Verify webhook signature
   * Cryptomus sends signature in the 'sign' header
   */
  verifyWebhookSignature(data: any, signature: string): boolean {
    try {
      if (!signature) {
        this.logger.warn('No signature provided in webhook');
        return false;
      }

      // Remove 'sign' from data if present (it shouldn't be in the payload)
      const { sign, ...payloadData } = data;
      const payload = JSON.stringify(payloadData);
      const expectedSignature = this.generateSignature(payload);
      
      const isValid = expectedSignature.toLowerCase() === signature.toLowerCase();
      
      if (!isValid) {
        this.logger.warn('Webhook signature mismatch', {
          expected: expectedSignature,
          received: signature,
        });
      }
      
      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Create a payment invoice
   */
  async createPayment(paymentData: CryptomusPaymentRequest): Promise<CryptomusPaymentResponse> {
    if (!this.merchantId || !this.paymentApiKey) {
      throw new BadRequestException('Cryptomus payment gateway is not configured');
    }

    try {
      const payload = JSON.stringify(paymentData);
      const signature = this.generateSignature(payload);

      const response = await this.apiClient.post<CryptomusPaymentResponse>(
        '/payment',
        paymentData,
        {
          headers: {
            'merchant': this.merchantId,
            'sign': signature,
          },
        },
      );

      if (response.data.state === 0) {
        return response.data;
      } else {
        throw new BadRequestException(`Cryptomus API error: ${response.data.state}`);
      }
    } catch (error: any) {
      this.logger.error('Error creating Cryptomus payment', error);
      if (error.response) {
        throw new BadRequestException(
          `Cryptomus API error: ${error.response.data?.message || error.message}`,
        );
      }
      throw new BadRequestException(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(uuid: string): Promise<CryptomusPaymentResponse> {
    if (!this.merchantId || !this.paymentApiKey) {
      throw new BadRequestException('Cryptomus payment gateway is not configured');
    }

    try {
      const payload = JSON.stringify({ uuid });
      const signature = this.generateSignature(payload);

      const response = await this.apiClient.post<CryptomusPaymentResponse>(
        '/payment/info',
        { uuid },
        {
          headers: {
            'merchant': this.merchantId,
            'sign': signature,
          },
        },
      );

      if (response.data.state === 0) {
        return response.data;
      } else {
        throw new BadRequestException(`Cryptomus API error: ${response.data.state}`);
      }
    } catch (error: any) {
      this.logger.error('Error getting Cryptomus payment status', error);
      if (error.response) {
        throw new BadRequestException(
          `Cryptomus API error: ${error.response.data?.message || error.message}`,
        );
      }
      throw new BadRequestException(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Get list of available currencies
   */
  async getCurrencies(): Promise<any> {
    if (!this.merchantId || !this.paymentApiKey) {
      throw new BadRequestException('Cryptomus payment gateway is not configured');
    }

    try {
      const payload = JSON.stringify({});
      const signature = this.generateSignature(payload);

      const response = await this.apiClient.post(
        '/currencies',
        {},
        {
          headers: {
            'merchant': this.merchantId,
            'sign': signature,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('Error getting Cryptomus currencies', error);
      throw new BadRequestException(`Failed to get currencies: ${error.message}`);
    }
  }
}

