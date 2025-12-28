import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    private leadsService: LeadsService,
  ) {}

  async purchaseLead(userId: string, leadId: string): Promise<{ message: string; purchase: Purchase }> {
    // Check if lead exists
    const lead = await this.leadsService.getLeadById(leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check if user already purchased this lead
    const existingPurchase = await this.purchasesRepository.findOne({
      where: { userId, leadId },
    });
    if (existingPurchase) {
      throw new ConflictException('Lead already purchased by this user');
    }

    // Create purchase
    const newPurchase = this.purchasesRepository.create({
      userId,
      leadId,
    });

    const savedPurchase = await this.purchasesRepository.save(newPurchase);

    return {
      message: 'Lead purchased successfully',
      purchase: savedPurchase,
    };
  }

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      where: { userId },
      relations: ['lead'],
    });
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      relations: ['user', 'lead'],
    });
  }

  async isLeadPurchasedByUser(userId: string, leadId: string): Promise<boolean> {
    const purchase = await this.purchasesRepository.findOne({
      where: { userId, leadId },
    });
    return !!purchase;
  }

  async getPurchasesByLeadId(leadId: string): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      where: { leadId },
      relations: ['user'],
    });
  }

  async isLeadPurchased(leadId: string): Promise<boolean> {
    const purchase = await this.purchasesRepository.findOne({
      where: { leadId },
    });
    return !!purchase;
  }

  async getSoldDataAnalytics(dateFrom?: string, dateTo?: string) {
    // Get all purchases with relations
    let purchases = await this.purchasesRepository.find({
      relations: ['lead', 'user'],
      order: { purchasedAt: 'DESC' },
    });

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      purchases = purchases.filter((purchase) => {
        const purchaseDate = new Date(purchase.purchasedAt);
        if (fromDate && purchaseDate < fromDate) return false;
        if (toDate) {
          const toDateEnd = new Date(toDate);
          toDateEnd.setHours(23, 59, 59, 999);
          if (purchaseDate > toDateEnd) return false;
        }
        return true;
      });
    }

    // Calculate total data sold (lifetime)
    const totalDataSold = await this.purchasesRepository.count();

    // Calculate today's sold
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysSold = await this.purchasesRepository
      .createQueryBuilder('purchase')
      .where('purchase.purchasedAt >= :today', { today })
      .andWhere('purchase.purchasedAt < :tomorrow', { tomorrow })
      .getCount();

    // Calculate monthly sold (current month)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const monthlySold = await this.purchasesRepository
      .createQueryBuilder('purchase')
      .where('purchase.purchasedAt >= :startOfMonth', { startOfMonth })
      .andWhere('purchase.purchasedAt < :startOfNextMonth', { startOfNextMonth })
      .getCount();

    // Format dates for display
    const todayFormatted = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const monthFormatted = today.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });

    return {
      totalDataSold,
      todaysSold,
      monthlySold,
      todayDate: todayFormatted,
      monthDate: monthFormatted,
      filteredPurchases: purchases,
    };
  }
}

