import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { Role } from '../users/enums/role.enum';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment (User only)' })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  async createPayment(@Request() req: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(req.user.userId, createPaymentDto);
  }

  @Get(':paymentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment status (User only)' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async getPaymentStatus(@Request() req: any, @Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId, req.user.userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user payments (User only)' })
  @ApiResponse({
    status: 200,
    description: 'User payments retrieved successfully',
  })
  async getUserPayments(@Request() req: any) {
    return this.paymentsService.getUserPayments(req.user.userId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NOWPayments webhook endpoint (IPN)' })
  @ApiBody({
    description: 'NOWPayments IPN webhook data',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(
    @Body() webhookData: any,
    @Headers('x-nowpayments-sig') signature: string,
  ) {
    // NOWPayments sends signature in the 'x-nowpayments-sig' header
    return this.paymentsService.handleWebhook(webhookData, signature || '');
  }
}

