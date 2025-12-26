import { IsString, MinLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'New username for the user account',
    example: 'john_doe_updated',
    minLength: 3,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  userName?: string;

  @ApiProperty({
    description: 'New email address for the user account',
    example: 'john.doe.updated@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;
}

