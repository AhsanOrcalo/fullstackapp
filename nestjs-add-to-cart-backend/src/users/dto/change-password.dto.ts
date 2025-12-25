import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'oldPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Old password must be at least 6 characters long' })
  oldPassword: string;

  @ApiProperty({
    description: 'New password for the user account',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'Password confirmation (must match new password)',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
  confirmPassword: string;
}

