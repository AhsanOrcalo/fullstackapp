import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { EnquiriesController } from './enquiries.controller';
import { EnquiriesService } from './enquiries.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { Enquiry, EnquirySchema } from './schemas/enquiry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Enquiry.name, schema: EnquirySchema }]),
    PassportModule,
  ],
  controllers: [EnquiriesController],
  providers: [EnquiriesService, RolesGuard],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}

