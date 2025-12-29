import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE', 'sqlite');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        if (dbType === 'mysql') {
          return {
            type: 'mysql',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 3306),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE'),
            entities: [User, Lead, Purchase, Enquiry],
            synchronize: !isProduction, // false in production, use migrations
            logging: !isProduction,
          };
        } else {
          // SQLite for development
          return {
            type: 'sqlite',
            database: configService.get<string>('DB_DATABASE', 'database.sqlite'),
            entities: [User, Lead, Purchase, Enquiry],
            synchronize: true,
            logging: !isProduction,
          };
        }
      },
      inject: [ConfigService],
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
