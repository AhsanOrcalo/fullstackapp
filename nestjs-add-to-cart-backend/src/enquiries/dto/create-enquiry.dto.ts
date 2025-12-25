import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnquiryDto {
  @ApiProperty({
    description: 'Enquiry message',
    example: 'I have a question about the pricing structure.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  message: string;
}

