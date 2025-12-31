import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '../payment.schema';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Amount to pay',
    example: 100.50,
    type: Number,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CRYPTOMUS,
    required: false,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Lead ID to purchase (if purchasing a lead)',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiProperty({
    description: 'Additional data for payment',
    required: false,
  })
  @IsString()
  @IsOptional()
  additionalData?: string;
}

