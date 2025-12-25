import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterLeadsDto {
  @ApiProperty({
    description: 'Search by name (searches in first name and last name)',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filter by city',
    example: 'Los Angeles',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Filter by date of birth from year (e.g., 1970)',
    example: 1970,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  dobFrom?: number;

  @ApiProperty({
    description: 'Filter by date of birth to year (e.g., 2000)',
    example: 2000,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  dobTo?: number;

  @ApiProperty({
    description: 'Filter by zip code',
    example: '90001',
    required: false,
  })
  @IsString()
  @IsOptional()
  zip?: string;

  @ApiProperty({
    description: 'Filter by state',
    example: 'California',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Sort by price: "high-to-low" or "low-to-high"',
    example: 'high-to-low',
    required: false,
    enum: ['high-to-low', 'low-to-high'],
  })
  @IsString()
  @IsIn(['high-to-low', 'low-to-high'])
  @IsOptional()
  priceSort?: 'high-to-low' | 'low-to-high';

  @ApiProperty({
    description: 'Filter by score: "700+" or "800+"',
    example: '700+',
    required: false,
    enum: ['700+', '800+'],
  })
  @IsString()
  @IsIn(['700+', '800+'])
  @IsOptional()
  scoreFilter?: '700+' | '800+';
}

