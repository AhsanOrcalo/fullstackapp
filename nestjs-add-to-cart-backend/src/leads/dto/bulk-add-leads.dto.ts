import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddLeadDto } from './add-lead.dto';

export class BulkAddLeadsDto {
  @ApiProperty({
    description: 'Array of leads to add',
    type: [AddLeadDto],
    example: [
      {
        firstName: 'John',
        lastName: 'Doe',
        price: 50000,
        address: '123 Main Street',
        state: 'California',
        city: 'Los Angeles',
        zip: '90001',
        dob: '1990-01-15',
        ssn: '123456789',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        score: 750,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddLeadDto)
  leads: AddLeadDto[];
}

