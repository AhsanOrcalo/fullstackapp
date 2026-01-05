import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  BALANCE = 'balance',
  NOWPAYMENTS = 'nowpayments',
}

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Purchase', required: false })
  purchaseId?: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, enum: PaymentMethod, default: PaymentMethod.BALANCE })
  paymentMethod: PaymentMethod;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // NOWPayments specific fields
  @Prop({ required: false })
  nowpaymentsPaymentId?: number;

  @Prop({ required: false })
  nowpaymentsInvoiceId?: number;

  @Prop({ required: false })
  nowpaymentsPayAddress?: string;

  @Prop({ required: false })
  nowpaymentsPayCurrency?: string;

  @Prop({ required: false })
  nowpaymentsPriceCurrency?: string;

  @Prop({ required: false })
  nowpaymentsPaymentUrl?: string;

  @Prop({ required: false })
  nowpaymentsPurchaseId?: string;

  @Prop({ required: false })
  nowpaymentsOrderId?: string;

  @Prop({ required: false })
  nowpaymentsOrderDescription?: string;

  @Prop({ required: false, type: Date })
  nowpaymentsExpiredAt?: Date;

  @Prop({ required: false, type: Object })
  nowpaymentsResponse?: any;

  @Prop({ required: false, type: Date })
  paidAt?: Date;

  @Prop({ required: false })
  failureReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

