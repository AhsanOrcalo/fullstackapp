import { Injectable, Inject, forwardRef } from '@nestjs/common';
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

  async getAllLeads(filters?: FilterLeadsDto): Promise<Lead[]> {
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

      // Filter by score
      if (filters.scoreFilter) {
        if (filters.scoreFilter === '700+') {
          // 700+ means score between 700 to 800 (700 <= score < 800)
          query.score = { $gte: 700, $lt: 800 };
        } else if (filters.scoreFilter === '800+') {
          // 800+ means score >= 800
          query.score = { $gte: 800 };
        }
      }
    }

    let queryBuilder = this.leadModel.find(query);

    // Sort by price
    if (filters?.priceSort) {
      if (filters.priceSort === 'high-to-low') {
        queryBuilder = queryBuilder.sort({ price: -1 });
      } else {
        queryBuilder = queryBuilder.sort({ price: 1 });
      }
    }

    return queryBuilder.exec();
  }

  async getLeadById(leadId: string): Promise<LeadDocument | null> {
    return this.leadModel.findById(leadId);
  }
}
