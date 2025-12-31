import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { Purchase, PurchaseDocument } from '../purchases/schemas/purchase.schema';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Lead.name)
    private leadModel: Model<LeadDocument>,
    @InjectModel(Purchase.name)
    private purchaseModel: Model<PurchaseDocument>,
  ) {}

  async getDashboardStats() {
    try {
      // Get total users (excluding admin)
      const totalUsers = await this.userModel.countDocuments({ role: Role.USER });

      // Get total records (leads)
      const totalRecords = await this.leadModel.countDocuments();

      // Get total activity count (all records)
      const recentActivity = totalRecords;

      // Check system status - try to query all entities
      let systemStatus = 'Active';
      try {
        await this.userModel.countDocuments();
        await this.leadModel.countDocuments();
        await this.purchaseModel.countDocuments();
      } catch (error) {
        systemStatus = 'Error';
      }

      // Get all purchases with lead relations
      const allPurchases = await this.purchaseModel
        .find()
        .populate('leadId')
        .exec();

      // Get all leads
      const allLeads = await this.leadModel.find().exec();

      // Get purchased lead IDs
      const purchasedLeadIds = new Set(
        allPurchases.map((purchase) => purchase.leadId?.toString()),
      );

      // Helper function to parse score (handles both string and number)
      const parseScore = (score: any): number | null => {
        if (!score) return null;
        if (typeof score === 'number') return score;
        const parsed = parseFloat(String(score));
        return isNaN(parsed) ? null : parsed;
      };

      // Count sold data with score >= 700
      const soldData700Plus = allPurchases.filter((purchase) => {
        const lead = purchase.leadId as any;
        const score = parseScore(lead?.score);
        return score !== null && score >= 700;
      }).length;

      // Count sold data with score >= 800
      const soldData800Plus = allPurchases.filter((purchase) => {
        const lead = purchase.leadId as any;
        const score = parseScore(lead?.score);
        return score !== null && score >= 800;
      }).length;

      // Count available (not purchased) data with score between 700-799
      const availableData700Plus = allLeads.filter((lead) => {
        if (purchasedLeadIds.has(lead._id.toString())) return false; // Exclude purchased
        const score = parseScore(lead.score);
        return score !== null && score >= 700 && score < 800;
      }).length;

      // Count available (not purchased) data with score >= 800
      const availableData800Plus = allLeads.filter((lead) => {
        if (purchasedLeadIds.has(lead._id.toString())) return false; // Exclude purchased
        const score = parseScore(lead.score);
        return score !== null && score >= 800;
      }).length;

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
      const userPurchases = await this.purchaseModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('leadId')
        .exec();

      const dataPurchased = userPurchases.length;

      // Calculate total spent (sum of all purchased lead prices)
      const totalSpent = userPurchases.reduce((sum, purchase) => {
        const lead = purchase.leadId as any;
        return sum + (lead?.price || 0);
      }, 0);

      // Get user balance from user entity
      const user = await this.userModel.findById(userId);

      const availableBalance = user ? parseFloat(user.balance?.toString() || '0') : 0.0;

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
