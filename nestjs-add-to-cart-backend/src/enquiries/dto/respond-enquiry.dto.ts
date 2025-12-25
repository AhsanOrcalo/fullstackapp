import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondEnquiryDto {
  @ApiProperty({
    description: 'Admin response to the enquiry',
    example: 'Thank you for your enquiry. Our pricing structure is...',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Response must be at least 10 characters long' })
  response: string;
}

