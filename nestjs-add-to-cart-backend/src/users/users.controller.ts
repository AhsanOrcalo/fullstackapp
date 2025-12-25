import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Role } from './enums/role.enum';

@ApiTags('auth')
@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        message: 'User registered successfully',
        user: {
          id: '1234567890',
          userName: 'john_doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Username, email, or phone number already exists, or passwords do not match',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['Username must be at least 3 characters long'],
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.usersService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '1234567890',
          userName: 'john_doe',
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['Password must be at least 6 characters long'],
        error: 'Bad Request',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or old password is incorrect',
    schema: {
      example: {
        statusCode: 401,
        message: 'Old password is incorrect',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or new password same as old password',
    schema: {
      example: {
        statusCode: 400,
        message: 'New password must be different from old password',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'New password and confirm password do not match',
    schema: {
      example: {
        statusCode: 409,
        message: 'New password and confirm password do not match',
        error: 'Conflict',
      },
    },
  })
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all registered users (Admin only, excludes admin users)' })
  @ApiResponse({
    status: 200,
    description: 'List of all registered users (excluding admin users)',
    schema: {
      example: [
        {
          id: '1234567890',
          userName: 'john_doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          role: 'user',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '9876543210',
          userName: 'jane_smith',
          email: 'jane.smith@example.com',
          phoneNumber: '+0987654321',
          role: 'user',
          createdAt: '2024-01-02T00:00:00.000Z',
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
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}

