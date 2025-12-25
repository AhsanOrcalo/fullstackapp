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
}

