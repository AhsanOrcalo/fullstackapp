import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LeadsService } from './leads.service';
import { AddLeadDto } from './dto/add-lead.dto';
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
  @ApiQuery({ name: 'scoreFilter', required: false, type: String, enum: ['700+', '800+'], description: 'Filter by score: "700+" or "800+"' })
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
          createdAt: '2024-01-01T00:00:00.000Z',
          isPurchased: false,
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
          createdAt: '2024-01-02T00:00:00.000Z',
          isPurchased: true,
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
    const leads = await this.leadsService.getAllLeads(filterDto);
    const userId = req.user.userId;

    // Add purchase status for each lead
    const leadsWithPurchaseStatus = await Promise.all(
      leads.map(async (lead) => {
        const isPurchased = await this.purchasesService.isLeadPurchasedByUser(userId, lead.id);
        return {
          ...lead,
          isPurchased,
        };
      }),
    );

    return leadsWithPurchaseStatus;
  }
}

