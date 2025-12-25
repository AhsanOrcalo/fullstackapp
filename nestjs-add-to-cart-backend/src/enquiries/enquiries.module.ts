import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { EnquiriesController } from './enquiries.controller';
import { EnquiriesService } from './enquiries.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { Enquiry } from './entities/enquiry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enquiry]),
    PassportModule,
  ],
  controllers: [EnquiriesController],
  providers: [EnquiriesService, RolesGuard],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}

