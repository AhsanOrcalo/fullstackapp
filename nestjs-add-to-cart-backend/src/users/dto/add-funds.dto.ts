import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class AddFundsDto {
  @ApiProperty({
    description: 'Amount to add to user balance',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;
}

