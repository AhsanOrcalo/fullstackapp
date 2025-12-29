import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EnquiryStatus {
  PENDING = 'pending',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

export type EnquiryDocument = Enquiry & Document;

@Schema({ timestamps: true })
export class Enquiry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, enum: EnquiryStatus, default: EnquiryStatus.PENDING })
  status: EnquiryStatus;

  @Prop({ type: String, required: false })
  adminResponse?: string;

  @Prop({ type: Types.ObjectId, required: false })
  respondedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EnquirySchema = SchemaFactory.createForClass(Enquiry);

