import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CryptomusService } from './cryptomus.service';
import { Payment, PaymentSchema } from './payment.schema';
import { LeadsModule } from '../leads/leads.module';
import { UsersModule } from '../users/users.module';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    LeadsModule,
    UsersModule,
    PurchasesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, CryptomusService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

