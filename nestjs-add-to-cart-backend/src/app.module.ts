import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { PurchasesModule } from './purchases/purchases.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { User } from './users/entities/user.entity';
import { Lead } from './leads/entities/lead.entity';
import { Purchase } from './purchases/entities/purchase.entity';
import { Enquiry } from './enquiries/entities/enquiry.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Lead, Purchase, Enquiry],
      synchronize: true, // Set to false in production and use migrations
    }),
    UsersModule,
    LeadsModule,
    PurchasesModule,
    EnquiriesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
