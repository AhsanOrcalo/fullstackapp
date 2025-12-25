import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [PassportModule, forwardRef(() => PurchasesModule)],
  controllers: [LeadsController],
  providers: [LeadsService, RolesGuard],
  exports: [LeadsService],
})
export class LeadsModule {}

