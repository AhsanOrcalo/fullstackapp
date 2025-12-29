import { Controller, Post, Get, Put, Body, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { RespondEnquiryDto } from './dto/respond-enquiry.dto';
import { Roles } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { Role } from '../users/enums/role.enum';

@ApiTags('enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new enquiry (User only)' })
  @ApiBody({ type: CreateEnquiryDto })
  @ApiResponse({
    status: 201,
    description: 'Enquiry created successfully',
  })
  async createEnquiry(@Request() req: any, @Body() createEnquiryDto: CreateEnquiryDto) {
    const enquiry = await this.enquiriesService.createEnquiry(req.user.userId, createEnquiryDto);
    const enquiryObj = enquiry.toObject ? enquiry.toObject() : enquiry;
    return {
      ...enquiryObj,
      id: (enquiry as any)._id?.toString() || (enquiry as any).id,
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user own enquiries (User only)' })
  @ApiResponse({
    status: 200,
    description: 'List of user enquiries',
  })
  async getUserEnquiries(@Request() req: any) {
    const enquiries = await this.enquiriesService.getUserEnquiries(req.user.userId);
    return enquiries.map((enquiry) => {
      const enquiryObj = enquiry.toObject ? enquiry.toObject() : enquiry;
      const userId = enquiry.userId ? (typeof enquiry.userId === 'object' && (enquiry.userId as any)._id 
        ? (enquiry.userId as any)._id.toString() 
        : enquiry.userId.toString()) : null;
      return {
        ...enquiryObj,
        id: (enquiry as any)._id?.toString() || (enquiry as any).id,
        userId: userId,
      };
    });
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all enquiries (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all enquiries',
  })
  async getAllEnquiries() {
    const enquiries = await this.enquiriesService.getAllEnquiries();
    return enquiries.map((enquiry) => {
      const enquiryObj = enquiry.toObject ? enquiry.toObject() : enquiry;
      // Handle populated userId
      let user: any = null;
      let userId: string | null = null;
      if (enquiry.userId) {
        if (typeof enquiry.userId === 'object' && (enquiry.userId as any)._id) {
          // Populated user
          user = enquiry.userId;
          userId = (user as any)._id.toString();
        } else {
          userId = enquiry.userId.toString();
        }
      }
      return {
        ...enquiryObj,
        id: (enquiry as any)._id?.toString() || (enquiry as any).id,
        userId: userId,
        user: user ? {
          id: (user as any)._id?.toString() || (user as any).id,
          userName: (user as any).userName,
          email: (user as any).email,
        } : null,
      };
    });
  }

  @Put(':id/respond')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to an enquiry (Admin only)' })
  @ApiParam({ name: 'id', description: 'Enquiry ID' })
  @ApiBody({ type: RespondEnquiryDto })
  @ApiResponse({
    status: 200,
    description: 'Enquiry responded successfully',
  })
  async respondToEnquiry(
    @Request() req: any,
    @Param('id') id: string,
    @Body() respondEnquiryDto: RespondEnquiryDto,
  ) {
    return this.enquiriesService.respondToEnquiry(id, req.user.userId, respondEnquiryDto);
  }

  @Put(':id/close')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close an enquiry (User only)' })
  @ApiParam({ name: 'id', description: 'Enquiry ID' })
  @ApiResponse({
    status: 200,
    description: 'Enquiry closed successfully',
  })
  async closeEnquiry(@Request() req: any, @Param('id') id: string) {
    return this.enquiriesService.closeEnquiry(id, req.user.userId);
  }
}

