import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { AddLeadDto } from './dto/add-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
  ) {}

  async addLead(addLeadDto: AddLeadDto): Promise<{ message: string; lead: Lead }> {
    const newLead = this.leadsRepository.create({
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
      score: addLeadDto.score,
    });

    const savedLead = await this.leadsRepository.save(newLead);

    return {
      message: 'Lead added successfully',
      lead: savedLead,
    };
  }

  async getAllLeads(filters?: FilterLeadsDto): Promise<Lead[]> {
    const queryBuilder = this.leadsRepository.createQueryBuilder('lead');

    if (filters) {
      // Filter by name (searches in firstName and lastName)
      if (filters.name) {
        queryBuilder.andWhere(
          '(LOWER(lead.firstName) LIKE LOWER(:name) OR LOWER(lead.lastName) LIKE LOWER(:name))',
          { name: `%${filters.name}%` },
        );
      }

      // Filter by city
      if (filters.city) {
        queryBuilder.andWhere('LOWER(lead.city) LIKE LOWER(:city)', {
          city: `%${filters.city}%`,
        });
      }

      // Filter by date of birth range
      if (filters.dobFrom || filters.dobTo) {
        if (filters.dobFrom && filters.dobTo) {
          const fromDate = `${filters.dobFrom}-01-01`;
          const toDate = `${filters.dobTo}-12-31`;
          queryBuilder.andWhere('lead.dob BETWEEN :fromDate AND :toDate', {
            fromDate,
            toDate,
          });
        } else if (filters.dobFrom) {
          const fromDate = `${filters.dobFrom}-01-01`;
          queryBuilder.andWhere('lead.dob >= :fromDate', {
            fromDate,
          });
        } else if (filters.dobTo) {
          const toDate = `${filters.dobTo}-12-31`;
          queryBuilder.andWhere('lead.dob <= :toDate', {
            toDate,
          });
        }
      }

      // Filter by zip code
      if (filters.zip) {
        queryBuilder.andWhere('lead.zip LIKE :zip', {
          zip: `%${filters.zip}%`,
        });
      }

      // Filter by state
      if (filters.state) {
        queryBuilder.andWhere('LOWER(lead.state) LIKE LOWER(:state)', {
          state: `%${filters.state}%`,
        });
      }

      // Filter by score
      if (filters.scoreFilter) {
        const minScore = filters.scoreFilter === '700+' ? 700 : 800;
        queryBuilder.andWhere('lead.score >= :minScore', { minScore });
      }

      // Sort by price
      if (filters.priceSort) {
        if (filters.priceSort === 'high-to-low') {
          queryBuilder.orderBy('lead.price', 'DESC');
        } else {
          queryBuilder.orderBy('lead.price', 'ASC');
        }
      }
    }

    return queryBuilder.getMany();
  }

  async getLeadById(leadId: string): Promise<Lead | null> {
    return this.leadsRepository.findOne({
      where: { id: leadId },
    });
  }
}

