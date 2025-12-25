import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Purchase } from './entities/purchase.entity';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class PurchasesService {
  private purchases: Purchase[] = []; // In-memory storage, replace with database later

  constructor(private leadsService: LeadsService) {}

  async purchaseLead(userId: string, leadId: string): Promise<{ message: string; purchase: Purchase }> {
    // Check if lead exists
    const lead = await this.leadsService.getLeadById(leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check if user already purchased this lead
    const existingPurchase = this.purchases.find(
      (p) => p.userId === userId && p.leadId === leadId,
    );
    if (existingPurchase) {
      throw new ConflictException('Lead already purchased by this user');
    }

    // Create purchase
    const newPurchase: Purchase = {
      id: Date.now().toString(),
      userId,
      leadId,
      purchasedAt: new Date(),
    };

    this.purchases.push(newPurchase);

    return {
      message: 'Lead purchased successfully',
      purchase: newPurchase,
    };
  }

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    return this.purchases.filter((p) => p.userId === userId);
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return this.purchases;
  }

  async isLeadPurchasedByUser(userId: string, leadId: string): Promise<boolean> {
    return this.purchases.some((p) => p.userId === userId && p.leadId === leadId);
  }

  async getPurchasesByLeadId(leadId: string): Promise<Purchase[]> {
    return this.purchases.filter((p) => p.leadId === leadId);
  }
}

