import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { Roles } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { Role } from '../users/enums/role.enum';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      example: {
        totalUsers: 150,
        totalRecords: 1250,
        recentActivity: 5,
        systemStatus: 'Active',
        soldData700Plus: 45,
        soldData800Plus: 12,
        availableData700Plus: 230,
        availableData800Plus: 89,
        totalSold: 57,
        randomSold: 3,
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
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('user-stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'User dashboard statistics retrieved successfully',
    schema: {
      example: {
        dataPurchased: 5,
        availableBalance: 0.0,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User access required',
  })
  async getUserDashboardStats(@Request() req: any) {
    return this.dashboardService.getUserDashboardStats(req.user.userId);
  }
}

