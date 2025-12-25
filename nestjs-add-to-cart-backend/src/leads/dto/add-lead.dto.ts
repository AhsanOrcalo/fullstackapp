import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, MinLength, Min, IsEmail, Matches, IsDateString } from 'class-validator';

export class AddLeadDto {
  @ApiProperty({
    description: 'First name of the lead',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the lead',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName: string;

  @ApiProperty({
    description: 'Price associated with the lead',
    example: 50000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @ApiProperty({
    description: 'Address of the lead',
    example: '123 Main Street',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  address: string;

  @ApiProperty({
    description: 'State of the lead',
    example: 'California',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'State must be at least 2 characters long' })
  state: string;

  @ApiProperty({
    description: 'City of the lead',
    example: 'Los Angeles',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  city: string;

  @ApiProperty({
    description: 'Zip code of the lead',
    example: '90001',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}(-\d{4})?$/, { message: 'Zip code must be in format 12345 or 12345-6789' })
  zip: string;

  @ApiProperty({
    description: 'Date of birth of the lead',
    example: '1990-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString({}, { message: 'DOB must be a valid date in YYYY-MM-DD format' })
  @IsNotEmpty()
  dob: string;

  @ApiProperty({
    description: 'Social Security Number of the lead',
    example: '123-45-6789',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}-\d{2}-\d{4}$/, { message: 'SSN must be in format XXX-XX-XXXX' })
  ssn: string;

  @ApiProperty({
    description: 'Email address of the lead',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty()
  email: string;
}

