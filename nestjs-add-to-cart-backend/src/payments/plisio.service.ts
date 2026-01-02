import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface PlisioPaymentRequest {
  amount: number;
  currency: string;
  order_number?: string;
  order_name?: string;
  description?: string;
  email?: string;
  callback_url?: string; // Status URL (webhook)
  success_url?: string;
  fail_url?: string;
}

export interface PlisioPaymentResponse {
  status: string;
  data: {
    txn_id: string;
    invoice_url: string;
    invoice_id: string;
    amount: string;
    currency: string;
    address?: string;
    expires_at?: number;
  };
}

export interface PlisioWebhookData {
  txn_id: string;
  invoice_id: string;
  order_number?: string;
  amount: string;
  currency: string;
  status: string;
  confirmations?: number;
  psys_cid?: string;
  source?: string;
  source_url?: string;
  wallet_hash?: string;
  fee?: string;
}

@Injectable()
export class PlisioService {
  private readonly logger = new Logger(PlisioService.name);
  private readonly apiClient: AxiosInstance;
  private readonly secretKey: string;
  private readonly baseUrl = 'https://plisio.net/api/v1';

  constructor() {
    // Hardcoded Plisio secret key from dashboard
    this.secretKey = '6MAwo7jI76ywGXBm9idA81of7JIepg3CNrcx5TUGBrDOhUOxlwyHKncyIYFbB6p6';

    if (!this.secretKey) {
      this.logger.warn('Plisio secret key not configured. Payment features will be disabled.');
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate signature for Plisio API requests
   */
  private generateSignature(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString + this.secretKey).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(data: any, signature: string): boolean {
    try {
      if (!signature) {
        this.logger.warn('No signature provided in webhook');
        return false;
      }

      const { verify_hash, ...payloadData } = data;
      const expectedSignature = this.generateSignature(payloadData);
      
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
  async createPayment(paymentData: PlisioPaymentRequest): Promise<PlisioPaymentResponse> {
    if (!this.secretKey) {
      throw new BadRequestException('Plisio payment gateway is not configured');
    }

    try {
      // Plisio API uses query parameter for secret key
      const response = await this.apiClient.post<PlisioPaymentResponse>(
        `/operations/${this.secretKey}/create`,
        paymentData,
      );

      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new BadRequestException(`Plisio API error: ${response.data.status || 'Unknown error'}`);
      }
    } catch (error: any) {
      this.logger.error('Error creating Plisio payment', error);
      if (error.response?.data) {
        throw new BadRequestException(
          `Plisio API error: ${error.response.data?.message || error.response.data?.error || error.message}`,
        );
      }
      throw new BadRequestException(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(txnId: string): Promise<PlisioPaymentResponse> {
    if (!this.secretKey) {
      throw new BadRequestException('Plisio payment gateway is not configured');
    }

    try {
      const response = await this.apiClient.get<PlisioPaymentResponse>(
        `/operations/${this.secretKey}/txns/${txnId}`,
      );

      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new BadRequestException(`Plisio API error: ${response.data.status}`);
      }
    } catch (error: any) {
      this.logger.error('Error getting Plisio payment status', error);
      if (error.response) {
        throw new BadRequestException(
          `Plisio API error: ${error.response.data?.message || error.message}`,
        );
      }
      throw new BadRequestException(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Get list of available currencies
   */
  async getCurrencies(): Promise<any> {
    if (!this.secretKey) {
      throw new BadRequestException('Plisio payment gateway is not configured');
    }

    try {
      const response = await this.apiClient.get(`/currencies/${this.secretKey}`);

      return response.data;
    } catch (error: any) {
      this.logger.error('Error getting Plisio currencies', error);
      throw new BadRequestException(`Failed to get currencies: ${error.message}`);
    }
  }
}

