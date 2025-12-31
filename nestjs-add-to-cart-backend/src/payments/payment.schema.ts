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
  CRYPTOMUS = 'cryptomus',
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

  // Cryptomus specific fields
  @Prop({ required: false })
  cryptomusOrderId?: string;

  @Prop({ required: false })
  cryptomusUuid?: string;

  @Prop({ required: false })
  cryptomusAddress?: string;

  @Prop({ required: false })
  cryptomusNetwork?: string;

  @Prop({ required: false })
  cryptomusCurrency?: string;

  @Prop({ required: false })
  cryptomusPaymentUrl?: string;

  @Prop({ required: false })
  cryptomusTxid?: string;

  @Prop({ required: false, type: Date })
  cryptomusExpiredAt?: Date;

  @Prop({ required: false })
  cryptomusAdditionalData?: string;

  @Prop({ required: false, type: Object })
  cryptomusResponse?: any;

  @Prop({ required: false, type: Date })
  paidAt?: Date;

  @Prop({ required: false })
  failureReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

