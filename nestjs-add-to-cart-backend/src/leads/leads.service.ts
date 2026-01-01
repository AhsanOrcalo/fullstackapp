import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddLeadDto } from './dto/add-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { Lead, LeadDocument } from './schemas/lead.schema';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name)
    private leadModel: Model<LeadDocument>,
  ) {}

  async addLead(addLeadDto: AddLeadDto): Promise<{ message: string; lead: Lead }> {
    const newLead = new this.leadModel({
      firstName: addLeadDto.firstName,
      lastName: addLeadDto.lastName,
      price: addLeadDto.price,
      address: addLeadDto.address,
      state: addLeadDto.state,
      city: addLeadDto.city,
      zip: addLeadDto.zip,
      dob: new Date(addLeadDto.dob),
      ssn: addLeadDto.ssn,
      email: addLeadDto.email,
      phone: addLeadDto.phone,
      score: addLeadDto.score,
    });

    const savedLead = await newLead.save();

    return {
      message: 'Lead added successfully',
      lead: savedLead,
    };
  }

  async getAllLeads(filters?: FilterLeadsDto): Promise<{ leads: Lead[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};

    if (filters) {
      // Filter by name (searches in firstName and lastName)
      if (filters.name) {
        query.$or = [
          { firstName: { $regex: filters.name, $options: 'i' } },
          { lastName: { $regex: filters.name, $options: 'i' } },
        ];
      }

      // Filter by city
      if (filters.city) {
        query.city = { $regex: filters.city, $options: 'i' };
      }

      // Filter by date of birth range
      if (filters.dobFrom || filters.dobTo) {
        query.dob = {};
        if (filters.dobFrom) {
          const fromDate = new Date(`${filters.dobFrom}-01-01`);
          query.dob.$gte = fromDate;
        }
        if (filters.dobTo) {
          const toDate = new Date(`${filters.dobTo}-12-31`);
          toDate.setHours(23, 59, 59, 999);
          query.dob.$lte = toDate;
        }
      }

      // Filter by zip code
      if (filters.zip) {
        query.zip = { $regex: filters.zip, $options: 'i' };
      }

      // Filter by state
      if (filters.state) {
        query.state = { $regex: filters.state, $options: 'i' };
      }

      // Filter by Canada - filter by Canadian provinces/territories
      if (filters.canadaFilter === 'canada') {
        const canadianProvinces = [
          'Ontario',
          'Quebec',
          'British Columbia',
          'Alberta',
          'Manitoba',
          'Saskatchewan',
          'Nova Scotia',
          'New Brunswick',
          'Newfoundland and Labrador',
          'Newfoundland',
          'Prince Edward Island',
          'Northwest Territories',
          'Yukon',
          'Nunavut',
        ];
        // Create $or condition for Canadian provinces
        const canadaStateOr = canadianProvinces.map(province => ({
          state: { $regex: `^${province}$`, $options: 'i' }
        }));
        
        // If there's already an $or for name search, we need to combine with $and
        if (query.$or && query.$or.length > 0) {
          // There's a name search $or, combine with $and
          const existingNameOr = query.$or;
          query.$and = [
            { $or: existingNameOr },
            { $or: canadaStateOr }
          ];
          delete query.$or;
        } else {
          // No existing $or, just use the Canada filter
          query.$or = canadaStateOr;
        }
      }

      // Filter by score - we'll handle this in JavaScript after fetching to avoid MongoDB conversion errors
      // Just mark which filter to apply
    }

    // Handle score filters in JavaScript (safer than MongoDB $expr with $toDouble)
    const scoreFilterType = filters?.scoreFilter;
    const needsScoreFiltering = scoreFilterType === '700+' || scoreFilterType === '800+' || scoreFilterType === 'random';
    
    // Get all leads first if score filter is needed (to filter in JavaScript)
    let allLeads: LeadDocument[] = [];
    if (needsScoreFiltering) {
      allLeads = await this.leadModel.find(query).exec();
      
      // Apply score filter in JavaScript
      if (scoreFilterType === '700+') {
        // 700+ means score between 700 to 800 (700 <= score < 800)
        allLeads = allLeads.filter((lead: LeadDocument) => {
          if (!lead.score || lead.score === '') return false;
          const scoreNum = parseFloat(String(lead.score));
          return !isNaN(scoreNum) && scoreNum >= 700 && scoreNum < 800;
        });
      } else if (scoreFilterType === '800+') {
        // 800+ means score >= 800
        allLeads = allLeads.filter((lead: LeadDocument) => {
          if (!lead.score || lead.score === '') return false;
          const scoreNum = parseFloat(String(lead.score));
          return !isNaN(scoreNum) && scoreNum >= 800;
        });
      } else if (scoreFilterType === 'random') {
        // Random filter: show records where score is text/non-numeric or empty
        allLeads = allLeads.filter((lead: LeadDocument) => {
          if (!lead.score || lead.score === '') return true;
          const scoreNum = parseFloat(String(lead.score));
          return isNaN(scoreNum);
        });
      }
    }

    // Get total count for pagination
    const total = needsScoreFiltering 
      ? allLeads.length 
      : await this.leadModel.countDocuments(query);

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    let leads: LeadDocument[];
    if (needsScoreFiltering) {
      // Sort and paginate filtered results
      if (filters?.priceSort) {
        if (filters.priceSort === 'high-to-low') {
          allLeads.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else {
          allLeads.sort((a, b) => (a.price || 0) - (b.price || 0));
        }
      }
      leads = allLeads.slice(skip, skip + limit);
    } else {
      let queryBuilder = this.leadModel.find(query);
      
      // Sort by price
      if (filters?.priceSort) {
        if (filters.priceSort === 'high-to-low') {
          queryBuilder = queryBuilder.sort({ price: -1 });
        } else {
          queryBuilder = queryBuilder.sort({ price: 1 });
        }
      }
      
      // Apply pagination
      queryBuilder = queryBuilder.skip(skip).limit(limit);
      leads = await queryBuilder.exec();
    }
    
    const totalPages = Math.ceil(total / limit);

    return {
      leads,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getLeadById(leadId: string): Promise<LeadDocument | null> {
    return this.leadModel.findById(leadId);
  }

  async deleteLead(leadId: string): Promise<{ message: string }> {
    const result = await this.leadModel.findByIdAndDelete(leadId);
    if (!result) {
      throw new NotFoundException('Lead not found');
    }
    return { message: 'Lead deleted successfully' };
  }

  async deleteLeads(leadIds: string[]): Promise<{ message: string; deletedCount: number }> {
    const result = await this.leadModel.deleteMany({ _id: { $in: leadIds } });
    return {
      message: `${result.deletedCount} lead(s) deleted successfully`,
      deletedCount: result.deletedCount,
    };
  }
}
