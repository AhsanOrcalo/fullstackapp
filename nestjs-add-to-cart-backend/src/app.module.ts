import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { PurchasesModule } from './purchases/purchases.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/cart-backend',
    ),
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
