import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
  ) {}

  async getDashboardStats() {
    try {
      // Get total users (excluding admin)
      const totalUsers = await this.usersRepository.count({
        where: { role: Role.USER },
      });

      // Get total records (leads)
      const totalRecords = await this.leadsRepository.count();

      // Get recent activity (last 5 records)
      const recentLeads = await this.leadsRepository.find({
        take: 5,
        order: { createdAt: 'DESC' },
      });
      const recentActivity = recentLeads.length;

      // Check system status - try to query all entities
      let systemStatus = 'Active';
      try {
        await this.usersRepository.count();
        await this.leadsRepository.count();
        await this.purchasesRepository.count();
      } catch (error) {
        systemStatus = 'Error';
      }

      // Get all purchases with lead relations
      const allPurchases = await this.purchasesRepository.find({
        relations: ['lead'],
      });

      // Get all leads
      const allLeads = await this.leadsRepository.find();

      // Get purchased lead IDs
      const purchasedLeadIds = new Set(
        allPurchases.map((purchase) => purchase.leadId),
      );

      // Count sold data with score >= 700
      const soldData700Plus = allPurchases.filter(
        (purchase) => purchase.lead?.score && purchase.lead.score >= 700,
      ).length;

      // Count sold data with score >= 800
      const soldData800Plus = allPurchases.filter(
        (purchase) => purchase.lead?.score && purchase.lead.score >= 800,
      ).length;

      // Count available (not purchased) data with score >= 700
      const availableData700Plus = allLeads.filter(
        (lead) =>
          !purchasedLeadIds.has(lead.id) &&
          typeof lead.score === 'number' &&
          lead.score >= 700,
      ).length;

      // Count available (not purchased) data with score >= 800
      const availableData800Plus = allLeads.filter(
        (lead) =>
          !purchasedLeadIds.has(lead.id) &&
          typeof lead.score === 'number' &&
          lead.score >= 800,
      ).length;

      return {
        totalUsers,
        totalRecords,
        recentActivity,
        systemStatus,
        soldData700Plus,
        soldData800Plus,
        availableData700Plus,
        availableData800Plus,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getUserDashboardStats(userId: string) {
    try {
      // Get user purchases count
      const userPurchases = await this.purchasesRepository.find({
        where: { userId },
        relations: ['lead'],
      });

      const dataPurchased = userPurchases.length;

      // Calculate total spent (sum of all purchased lead prices)
      const totalSpent = userPurchases.reduce((sum, purchase) => {
        return sum + (purchase.lead?.price || 0);
      }, 0);

      // For now, available balance is set to 0.0
      // In a real system, this would come from a user balance field or payment system
      const availableBalance = 0.0;

      return {
        dataPurchased,
        availableBalance,
        totalSpent, // Optional: can be used for display
      };
    } catch (error) {
      console.error('Error fetching user dashboard stats:', error);
      throw error;
    }
  }
}

