import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { Purchase, PurchaseSchema } from '../purchases/schemas/purchase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
    PassportModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, RolesGuard],
  exports: [DashboardService],
})
export class DashboardModule {}

