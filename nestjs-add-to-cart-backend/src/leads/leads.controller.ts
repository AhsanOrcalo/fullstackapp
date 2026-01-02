import { Controller, Post, Get, Delete, Body, HttpCode, HttpStatus, UseGuards, Request, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LeadsService } from './leads.service';
import { AddLeadDto } from './dto/add-lead.dto';
import { BulkAddLeadsDto } from './dto/bulk-add-leads.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { Roles } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { Role } from '../users/enums/role.enum';
import { PurchasesService } from '../purchases/purchases.service';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly purchasesService: PurchasesService,
  ) {}

  @Post('add-lead')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new lead (Admin only)' })
  @ApiBody({ type: AddLeadDto })
  @ApiResponse({
    status: 201,
    description: 'Lead successfully added',
    schema: {
      example: {
        message: 'Lead added successfully',
        lead: {
          id: '1234567890',
          firstName: 'John',
          lastName: 'Doe',
          price: 50000,
          address: '123 Main Street',
          state: 'California',
          city: 'Los Angeles',
          zip: '90001',
          dob: '1990-01-15T00:00:00.000Z',
          ssn: '123-45-6789',
          email: 'john.doe@example.com',
          score: 750,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions. Admin access required.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['First name must be at least 2 characters long'],
        error: 'Bad Request',
      },
    },
  })
  async addLead(@Body() addLeadDto: AddLeadDto) {
    return this.leadsService.addLead(addLeadDto);
  }

  @Post('bulk/add')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk add multiple leads (Admin only)' })
  @ApiBody({ type: BulkAddLeadsDto })
  @ApiResponse({
    status: 201,
    description: 'Leads bulk import completed',
    schema: {
      example: {
        message: 'Bulk import completed: 100 succeeded, 5 failed',
        successCount: 100,
        failedCount: 5,
        errors: [
          { index: 10, error: 'Validation error' },
          { index: 25, error: 'Duplicate email' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  async bulkAddLeads(@Body() bulkAddLeadsDto: BulkAddLeadsDto) {
    return this.leadsService.bulkAddLeads(bulkAddLeadsDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all leads with optional filters (Admin and User access)' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Search by name (searches in first name and last name)' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'Filter by city' })
  @ApiQuery({ name: 'dobFrom', required: false, type: Number, description: 'Filter by date of birth from year (e.g., 1970)' })
  @ApiQuery({ name: 'dobTo', required: false, type: Number, description: 'Filter by date of birth to year (e.g., 2000)' })
  @ApiQuery({ name: 'zip', required: false, type: String, description: 'Filter by zip code' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Filter by state' })
  @ApiQuery({ name: 'priceSort', required: false, type: String, enum: ['high-to-low', 'low-to-high'], description: 'Sort by price: "high-to-low" or "low-to-high"' })
  @ApiQuery({ name: 'scoreFilter', required: false, type: String, enum: ['700+', '800+', 'random'], description: 'Filter by score: "700+", "800+", or "random" (for text/non-numeric scores)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'List of filtered leads',
    schema: {
      example: [
        {
          id: '1234567890',
          firstName: 'John',
          lastName: 'Doe',
          price: 50000,
          address: '123 Main Street',
          state: 'California',
          city: 'Los Angeles',
          zip: '90001',
          dob: '1990-01-15T00:00:00.000Z',
          ssn: '123-45-6789',
          email: 'john.doe@example.com',
          score: 750,
          createdAt: '2024-01-01T00:00:00.000Z',
          isPurchased: false,
          isPurchasedByAnyone: false,
        },
        {
          id: '9876543210',
          firstName: 'Jane',
          lastName: 'Smith',
          price: 75000,
          address: '456 Oak Avenue',
          state: 'New York',
          city: 'New York City',
          zip: '10001',
          dob: '1985-05-20T00:00:00.000Z',
          ssn: '987-65-4321',
          email: 'jane.smith@example.com',
          score: 820,
          createdAt: '2024-01-02T00:00:00.000Z',
          isPurchased: true,
          isPurchasedByAnyone: true,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Authentication required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions. Admin access required.',
        error: 'Forbidden',
      },
    },
  })
  async getAllLeads(@Request() req: any, @Query() filterDto: FilterLeadsDto) {
    const result = await this.leadsService.getAllLeads(filterDto);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // For regular users: filter out leads that have been purchased by ANY user
    // For admins: show all leads (they can see everything)
    let availableLeads = result.leads;
    if (userRole === Role.USER) {
      // Filter out leads that have been purchased by anyone
      const leadsWithPurchaseStatus = await Promise.all(
        result.leads.map(async (lead) => {
          const leadId = (lead as any)._id?.toString() || (lead as any).id;
          const isPurchasedByAnyone = await this.purchasesService.isLeadPurchased(leadId);
          return {
            lead,
            isPurchasedByAnyone,
          };
        }),
      );
      // Only return leads that haven't been purchased by anyone
      availableLeads = leadsWithPurchaseStatus
        .filter(({ isPurchasedByAnyone }) => !isPurchasedByAnyone)
        .map(({ lead }) => lead);
    }

    // Add purchase status for each lead (whether current user has purchased it)
    // For admins, also add isPurchasedByAnyone to show if lead is sold to anyone
    const leadsWithPurchaseStatus = await Promise.all(
      availableLeads.map(async (lead) => {
        const leadId = (lead as any)._id?.toString() || (lead as any).id;
        const isPurchased = await this.purchasesService.isLeadPurchasedByUser(userId, leadId);
        const isPurchasedByAnyone = userRole === Role.ADMIN 
          ? await this.purchasesService.isLeadPurchased(leadId)
          : undefined;
        const leadObj = (lead as any).toObject ? (lead as any).toObject() : lead;
        
        // Determine status: 'available' if not purchased by anyone, 'unavailable' if purchased
        const status = isPurchasedByAnyone ? 'unavailable' : 'available';
        
        return {
          ...leadObj,
          id: (lead as any)._id?.toString() || (lead as any).id,
          isPurchased,
          isPurchasedByAnyone,
          status,
        };
      }),
    );

    return {
      leads: leadsWithPurchaseStatus,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Delete('bulk/delete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple leads by IDs (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        leadIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['leadId1', 'leadId2'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Leads successfully deleted',
    schema: {
      example: {
        message: '2 lead(s) deleted successfully',
        deletedCount: 2,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async deleteLeads(@Body() body: { leadIds: string[] }) {
    return this.leadsService.deleteLeads(body.leadIds);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lead by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Lead successfully deleted',
    schema: {
      example: {
        message: 'Lead deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  async deleteLead(@Param('id') id: string) {
    return this.leadsService.deleteLead(id);
  }
}

