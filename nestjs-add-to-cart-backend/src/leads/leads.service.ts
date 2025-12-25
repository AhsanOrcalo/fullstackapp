import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { AddLeadDto } from './dto/add-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  private leads: Lead[] = []; // In-memory storage, replace with database later

  async addLead(addLeadDto: AddLeadDto): Promise<{ message: string; lead: Lead }> {
    const newLead: Lead = {
      id: Date.now().toString(),
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
      createdAt: new Date(),
    };

    this.leads.push(newLead);

    return {
      message: 'Lead added successfully',
      lead: newLead,
    };
  }

  async getAllLeads(filters?: FilterLeadsDto): Promise<Lead[]> {
    let filteredLeads = [...this.leads];

    if (filters) {
      // Filter by name (searches in firstName and lastName)
      if (filters.name) {
        const nameLower = filters.name.toLowerCase();
        filteredLeads = filteredLeads.filter(
          (lead) =>
            lead.firstName.toLowerCase().includes(nameLower) ||
            lead.lastName.toLowerCase().includes(nameLower),
        );
      }

      // Filter by city
      if (filters.city) {
        const cityLower = filters.city.toLowerCase();
        filteredLeads = filteredLeads.filter((lead) =>
          lead.city.toLowerCase().includes(cityLower),
        );
      }

      // Filter by date of birth range
      if (filters.dobFrom || filters.dobTo) {
        filteredLeads = filteredLeads.filter((lead) => {
          const leadYear = lead.dob.getFullYear();
          if (filters.dobFrom && filters.dobTo) {
            return leadYear >= filters.dobFrom && leadYear <= filters.dobTo;
          } else if (filters.dobFrom) {
            return leadYear >= filters.dobFrom;
          } else if (filters.dobTo) {
            return leadYear <= filters.dobTo;
          }
          return true;
        });
      }

      // Filter by zip code
      if (filters.zip) {
        filteredLeads = filteredLeads.filter((lead) =>
          lead.zip.includes(filters.zip!),
        );
      }

      // Filter by state
      if (filters.state) {
        const stateLower = filters.state.toLowerCase();
        filteredLeads = filteredLeads.filter((lead) =>
          lead.state.toLowerCase().includes(stateLower),
        );
      }

      // Filter by score
      if (filters.scoreFilter) {
        const minScore = filters.scoreFilter === '700+' ? 700 : 800;
        filteredLeads = filteredLeads.filter((lead) => {
          // Only include leads that have a score and meet the minimum
          return lead.score !== undefined && lead.score >= minScore;
        });
      }
    }

    // Sort by price (applied after filtering)
    if (filters?.priceSort) {
      filteredLeads.sort((a, b) => {
        if (filters.priceSort === 'high-to-low') {
          return b.price - a.price; // Descending order
        } else {
          return a.price - b.price; // Ascending order
        }
      });
    }

    return filteredLeads;
  }

  async getLeadById(leadId: string): Promise<Lead | undefined> {
    return this.leads.find((l) => l.id === leadId);
  }
}

