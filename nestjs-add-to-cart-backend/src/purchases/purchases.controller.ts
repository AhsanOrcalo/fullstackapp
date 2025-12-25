import { Controller, Post, Put, Get, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PurchasesService } from './purchases.service';
import { Roles } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { Role } from '../users/enums/role.enum';
import { LeadsService } from '../leads/leads.service';
import { UsersService } from '../users/users.service';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly purchasesService: PurchasesService,
    private readonly leadsService: LeadsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('lead/:leadId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase a lead (User only)' })
  @ApiParam({
    name: 'leadId',
    description: 'ID of the lead to purchase',
    example: '1234567890',
  })
  @ApiResponse({
    status: 201,
    description: 'Lead purchased successfully',
    schema: {
      example: {
        message: 'Lead purchased successfully',
        purchase: {
          id: '1234567890',
          userId: 'user123',
          leadId: 'lead123',
          purchasedAt: '2024-01-01T00:00:00.000Z',
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
    description: 'Forbidden - User access required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions. Admin access required.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Lead not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Lead already purchased by this user',
    schema: {
      example: {
        statusCode: 409,
        message: 'Lead already purchased by this user',
        error: 'Conflict',
      },
    },
  })
  async purchaseLead(@Request() req: any, @Param('leadId') leadId: string) {
    return this.purchasesService.purchaseLead(req.user.userId, leadId);
  }

  @Put('lead/:leadId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update lead purchase status - Purchase a lead (User only)' })
  @ApiParam({
    name: 'leadId',
    description: 'ID of the lead to purchase',
    example: '1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Lead purchased successfully and updated with purchase status',
    schema: {
      example: {
        message: 'Lead purchased successfully',
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
          isPurchased: true,
        },
        purchase: {
          id: '1234567890',
          userId: 'user123',
          leadId: 'lead123',
          purchasedAt: '2024-01-01T00:00:00.000Z',
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
    description: 'Forbidden - User access required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions. Admin access required.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Lead not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Lead already purchased by this user',
    schema: {
      example: {
        statusCode: 409,
        message: 'Lead already purchased by this user',
        error: 'Conflict',
      },
    },
  })
  async updateLeadPurchase(@Request() req: any, @Param('leadId') leadId: string) {
    const purchaseResult = await this.purchasesService.purchaseLead(req.user.userId, leadId);
    const lead = await this.leadsService.getLeadById(leadId);
    
    return {
      message: purchaseResult.message,
      lead: {
        ...lead,
        isPurchased: true,
      },
      purchase: purchaseResult.purchase,
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user own purchases (User only)' })
  @ApiResponse({
    status: 200,
    description: 'List of user purchases with lead details',
    schema: {
      example: [
        {
          id: '1234567890',
          userId: 'user123',
          leadId: 'lead123',
          purchasedAt: '2024-01-01T00:00:00.000Z',
          lead: {
            id: 'lead123',
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
    description: 'Forbidden - User access required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions. Admin access required.',
        error: 'Forbidden',
      },
    },
  })
  async getUserPurchases(@Request() req: any) {
    const purchases = await this.purchasesService.getUserPurchases(req.user.userId);
    
    // Enrich purchases with lead details
    const purchasesWithLeads = await Promise.all(
      purchases.map(async (purchase) => {
        const lead = await this.leadsService.getLeadById(purchase.leadId);
        return {
          ...purchase,
          lead: lead || null,
        };
      }),
    );

    return purchasesWithLeads;
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all purchases (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all purchases with user and lead details',
    schema: {
      example: [
        {
          id: '1234567890',
          userId: 'user123',
          leadId: 'lead123',
          purchasedAt: '2024-01-01T00:00:00.000Z',
          lead: {
            id: 'lead123',
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
          user: {
            id: 'user123',
            userName: 'john_doe',
            email: 'john.doe@example.com',
            role: 'user',
          },
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
    description: 'Forbidden - Admin access required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions. Admin access required.',
        error: 'Forbidden',
      },
    },
  })
  async getAllPurchases() {
    const purchases = await this.purchasesService.getAllPurchases();
    
    // Enrich purchases with lead and user details
    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const lead = await this.leadsService.getLeadById(purchase.leadId);
        const user = await this.usersService.findOneById(purchase.userId);
        return {
          ...purchase,
          lead: lead || null,
          user: user
            ? {
                id: user.id,
                userName: user.userName,
                email: user.email,
                role: user.role,
              }
            : null,
        };
      }),
    );

    return purchasesWithDetails;
  }
}

