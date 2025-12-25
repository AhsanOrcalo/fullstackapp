import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { LeadsModule } from '../leads/leads.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, forwardRef(() => LeadsModule), UsersModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, RolesGuard],
  exports: [PurchasesService],
})
export class PurchasesModule {}

