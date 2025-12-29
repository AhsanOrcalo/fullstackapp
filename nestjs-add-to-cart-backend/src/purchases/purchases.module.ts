import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { LeadsModule } from '../leads/leads.module';
import { UsersModule } from '../users/users.module';
import { Purchase, PurchaseSchema } from './schemas/purchase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Purchase.name, schema: PurchaseSchema }]),
    PassportModule,
    forwardRef(() => LeadsModule),
    UsersModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService, RolesGuard],
  exports: [PurchasesService],
})
export class PurchasesModule {}

