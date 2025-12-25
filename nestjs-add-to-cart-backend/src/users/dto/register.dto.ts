import { IsString, MinLength, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for the user account',
    example: 'john_doe',
    minLength: 3,
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  userName: string;

  @ApiProperty({
    description: 'Email address for the user account',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Phone number for the user account',
    example: '+1234567890',
    pattern: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$',
  })
  @IsString()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/, {
    message: 'Please provide a valid phone number',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  confirmPassword: string;
}

