import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';
import { LeadsService } from '../leads/leads.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name)
    private purchaseModel: Model<PurchaseDocument>,
    private leadsService: LeadsService,
    private usersService: UsersService,
  ) {}

  async purchaseLead(userId: string, leadId: string): Promise<{ message: string; purchase: Purchase; remainingBalance: number }> {
    // Check if lead exists
    const lead = await this.leadsService.getLeadById(leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check if user already purchased this lead
    const existingPurchase = await this.purchaseModel.findOne({
      userId: new Types.ObjectId(userId),
      leadId: new Types.ObjectId(leadId),
    });
    if (existingPurchase) {
      throw new ConflictException('Lead already purchased by this user');
    }

    // Check if lead is already purchased by someone else
    const isPurchasedByAnyone = await this.isLeadPurchased(leadId);
    if (isPurchasedByAnyone) {
      throw new ConflictException('This lead is no longer available');
    }

    // Get user to check balance
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get lead price
    const leadPrice = parseFloat(lead.price?.toString() || '0');
    if (leadPrice <= 0) {
      throw new BadRequestException('Invalid lead price');
    }

    // Check if user has sufficient balance
    const currentBalance = parseFloat(user.balance?.toString() || '0');
    if (currentBalance < leadPrice) {
      throw new BadRequestException(`Not enough balance. You need $${leadPrice.toFixed(2)} but you only have $${currentBalance.toFixed(2)}. Please add funds to your account.`);
    }

    // Deduct funds from user balance
    const newBalance = currentBalance - leadPrice;
    user.balance = newBalance;
    await user.save();

    // Create purchase
    const newPurchase = new this.purchaseModel({
      userId: new Types.ObjectId(userId),
      leadId: new Types.ObjectId(leadId),
    });

    const savedPurchase = await newPurchase.save();

    return {
      message: 'Lead purchased successfully',
      purchase: savedPurchase,
      remainingBalance: newBalance,
    };
  }

  async getUserPurchases(userId: string): Promise<PurchaseDocument[]> {
    return this.purchaseModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('leadId')
      .exec();
  }

  async getAllPurchases(): Promise<PurchaseDocument[]> {
    return this.purchaseModel
      .find()
      .populate('userId')
      .populate('leadId')
      .exec();
  }

  async isLeadPurchasedByUser(userId: string, leadId: string): Promise<boolean> {
    const purchase = await this.purchaseModel.findOne({
      userId: new Types.ObjectId(userId),
      leadId: new Types.ObjectId(leadId),
    });
    return !!purchase;
  }

  async getPurchasesByLeadId(leadId: string): Promise<PurchaseDocument[]> {
    return this.purchaseModel
      .find({ leadId: new Types.ObjectId(leadId) })
      .populate('userId')
      .exec();
  }

  async isLeadPurchased(leadId: string): Promise<boolean> {
    const purchase = await this.purchaseModel.findOne({
      leadId: new Types.ObjectId(leadId),
    });
    return !!purchase;
  }

  async getSoldDataAnalytics(dateFrom?: string, dateTo?: string) {
    // Build date filter
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.purchasedAt = {};
      if (dateFrom) {
        dateFilter.purchasedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.purchasedAt.$lte = toDate;
      }
    }

    // Get all purchases with relations
    let purchases = await this.purchaseModel
      .find(dateFilter)
      .populate('leadId')
      .populate('userId')
      .sort({ purchasedAt: -1 })
      .exec();

    // Calculate total data sold (lifetime)
    const totalDataSold = await this.purchaseModel.countDocuments();

    // Calculate today's sold
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysSold = await this.purchaseModel.countDocuments({
      purchasedAt: { $gte: today, $lt: tomorrow },
    });

    // Calculate monthly sold (current month)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const monthlySold = await this.purchaseModel.countDocuments({
      purchasedAt: { $gte: startOfMonth, $lt: startOfNextMonth },
    });

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
