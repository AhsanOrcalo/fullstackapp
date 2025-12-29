import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { PurchasesModule } from '../purchases/purchases.module';
import { Lead, LeadSchema } from './schemas/lead.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    PassportModule,
    forwardRef(() => PurchasesModule),
  ],
  controllers: [LeadsController],
  providers: [LeadsService, RolesGuard],
  exports: [LeadsService],
})
export class LeadsModule {}

