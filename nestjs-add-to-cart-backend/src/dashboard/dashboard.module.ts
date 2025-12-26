import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../users/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Purchase } from '../purchases/entities/purchase.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Lead, Purchase]),
    PassportModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, RolesGuard],
  exports: [DashboardService],
})
export class DashboardModule {}

