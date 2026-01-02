import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddLeadDto } from './dto/add-lead.dto';
import { BulkAddLeadsDto } from './dto/bulk-add-leads.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { Lead, LeadDocument } from './schemas/lead.schema';

@Injectable()
export class LeadsService {
  // Canadian provinces and territories
  private readonly CANADIAN_PROVINCES = [
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

  // Major Canadian cities
  private readonly CANADIAN_CITIES = [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa',
    'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria',
    'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'Sherbrooke',
    'St. John\'s', 'Barrie', 'Kelowna', 'Abbotsford', 'Sudbury', 'Kingston',
    'Saguenay', 'Trois-Rivières', 'Guelph', 'Cambridge', 'Thunder Bay', 'Saint John'
  ];

  // US states
  private readonly US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
  ];

  // Major US cities
  private readonly US_CITIES = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
    'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Detroit', 'Nashville',
    'Portland', 'Oklahoma City', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore',
    'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City',
    'Mesa', 'Atlanta', 'Omaha', 'Raleigh', 'Miami', 'Long Beach', 'Virginia Beach',
    'Oakland', 'Minneapolis', 'Tulsa', 'Tampa', 'Arlington', 'New Orleans'
  ];

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

  async bulkAddLeads(bulkAddLeadsDto: BulkAddLeadsDto): Promise<{ message: string; successCount: number; failedCount: number; errors: Array<{ index: number; error: string }> }> {
    const leadsToInsert = bulkAddLeadsDto.leads.map(leadDto => ({
      firstName: leadDto.firstName,
      lastName: leadDto.lastName,
      price: leadDto.price,
      address: leadDto.address,
      state: leadDto.state,
      city: leadDto.city,
      zip: leadDto.zip,
      dob: new Date(leadDto.dob),
      ssn: leadDto.ssn,
      email: leadDto.email,
      phone: leadDto.phone,
      score: leadDto.score,
    }));

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ index: number; error: string }> = [];

    try {
      // Use insertMany for better performance with large datasets
      // ordered: false allows insertion to continue even if some documents fail
      const result = await this.leadModel.insertMany(leadsToInsert, { ordered: false });
      successCount = result.length;
    } catch (error: any) {
      // Handle bulk write errors
      if (error.writeErrors && error.writeErrors.length > 0) {
        // Some documents failed, but some may have succeeded
        successCount = error.result?.insertedCount || 0;
        failedCount = error.writeErrors.length;
        
        error.writeErrors.forEach((writeError: any, idx: number) => {
          errors.push({
            index: writeError.index,
            error: writeError.errmsg || writeError.err?.message || 'Validation error',
          });
        });
      } else {
        // All documents failed or other error
        failedCount = leadsToInsert.length;
        errors.push({
          index: 0,
          error: error.message || 'Bulk insert failed',
        });
      }
    }

    return {
      message: `Bulk import completed: ${successCount} succeeded, ${failedCount} failed`,
      successCount,
      failedCount,
      errors,
    };
  }

  async getAllLeads(filters?: FilterLeadsDto, excludePurchasedLeadIds?: any[]): Promise<{ leads: Lead[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};
    
    // Exclude purchased leads if provided
    if (excludePurchasedLeadIds && excludePurchasedLeadIds.length > 0) {
      query._id = { $nin: excludePurchasedLeadIds };
    }

    if (filters) {
      // Filter by name (searches in firstName, lastName, city, and state)
      if (filters.name) {
        query.$or = [
          { firstName: { $regex: filters.name, $options: 'i' } },
          { lastName: { $regex: filters.name, $options: 'i' } },
          { city: { $regex: filters.name, $options: 'i' } },
          { state: { $regex: filters.name, $options: 'i' } },
        ];
      }

      // Filter by city (only if name filter is not provided, to avoid duplicate search)
      if (filters.city && !filters.name) {
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

      // Filter by state (only if name filter is not provided, to avoid duplicate search)
      if (filters.state && !filters.name) {
        query.state = { $regex: filters.state, $options: 'i' };
      }

      // Filter by Canada - filter by Canadian provinces/territories (legacy filter)
      if (filters.canadaFilter === 'canada') {
        // Create $or condition for Canadian provinces
        const canadaStateOr = this.CANADIAN_PROVINCES.map(province => ({
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

      // Filter by country (Canada or USA) - filters by both state and city
      if (filters.countryFilter === 'canada' || filters.countryFilter === 'usa') {
        const isCanada = filters.countryFilter === 'canada';
        const states = isCanada ? this.CANADIAN_PROVINCES : this.US_STATES;
        const cities = isCanada ? this.CANADIAN_CITIES : this.US_CITIES;

        // Create $or conditions for states and cities
        const stateOr = states.map(state => ({
          state: { $regex: `^${state}$`, $options: 'i' }
        }));

        const cityOr = cities.map(city => ({
          city: { $regex: `^${city}$`, $options: 'i' }
        }));

        // Combine state and city conditions with $or
        const countryOr = [...stateOr, ...cityOr];

        // If there's already an $or for name search, we need to combine with $and
        if (query.$or && query.$or.length > 0) {
          // There's a name search $or, combine with $and
          const existingNameOr = query.$or;
          query.$and = [
            { $or: existingNameOr },
            { $or: countryOr }
          ];
          delete query.$or;
        } else {
          // No existing $or, just use the country filter
          query.$or = countryOr;
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
