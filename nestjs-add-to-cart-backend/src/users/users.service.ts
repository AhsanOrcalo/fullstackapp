import { Injectable, ConflictException, UnauthorizedException, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from './enums/role.enum';
import { EmailService } from '../email/email.service';
import { Payment, PaymentDocument, PaymentStatus, PaymentMethod } from '../payments/payment.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async onModuleInit() {
    // Create initial admin user on service initialization
    await this.createInitialAdmin();
  }

  private async createInitialAdmin() {
    // Check if admin already exists
    const adminExists = await this.userModel.findOne({ role: Role.ADMIN });
    if (adminExists) {
      return;
    }

    // Create default admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds); // Change this password in production

    const adminUser = new this.userModel({
      userName: 'admin',
      email: 'admin@example.com',
      phoneNumber: '+1234567890',
      password: hashedPassword,
      role: Role.ADMIN,
    });

    await adminUser.save();
    console.log('Initial admin user created. Username: admin, Password: admin123');
  }

  async register(registerDto: RegisterDto): Promise<{ message: string; user: { id: string; userName: string; email: string; phoneNumber: string; role: Role } }> {
    const { userName, email, phoneNumber, password, confirmPassword } = registerDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    // Check if username already exists
    const existingUserByUsername = await this.userModel.findOne({ userName });
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists
    const existingUserByEmail = await this.userModel.findOne({ email });
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone number already exists
    const existingUserByPhone = await this.userModel.findOne({ phoneNumber });
    if (existingUserByPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with default role 'user' and balance 0
    const newUser = new this.userModel({
      userName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: Role.USER, // Default role is 'user'
      balance: 0.0, // New users start with 0 balance
    });

    await newUser.save();

    return {
      message: 'User registered successfully',
      user: {
        id: newUser._id.toString(),
        userName: newUser.userName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: { id: string; userName: string; role: Role } }> {
    const { userName, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ userName });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token with role included
    const payload = { sub: user._id.toString(), userName: user.userName, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        userName: user.userName,
        role: user.role,
      },
    };
  }

  async findOneById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

    // Find user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      throw new ConflictException('New password and confirm password do not match');
    }

    // Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from old password');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  async getAllUsers(): Promise<{ id: string; userName: string; email: string; phoneNumber: string; role: Role; balance: number; createdAt: Date }[]> {
    // Return all users without password field, excluding admin users
    const users = await this.userModel.find({ role: Role.USER }).select('-password');
    return users.map(user => ({
      id: user._id.toString(),
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      balance: parseFloat(user.balance?.toString() || '0'),
      createdAt: user.createdAt || new Date(),
    }));
  }

  async getProfile(userId: string): Promise<{ id: string; userName: string; email: string; phoneNumber: string; role: Role; createdAt: Date }> {
    const user = await this.userModel.findById(userId).select('-password');
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return {
      id: user._id.toString(),
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt || new Date(),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{ message: string; user: { id: string; userName: string; email: string; phoneNumber: string; role: Role } }> {
    const { userName, email } = updateProfileDto;

    // Find user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if at least one field is provided
    if (!userName && !email) {
      throw new BadRequestException('At least one field (userName or email) must be provided');
    }

    // Check if username is being changed and if it already exists
    if (userName && userName !== user.userName) {
      const existingUserByUsername = await this.userModel.findOne({ userName });
      if (existingUserByUsername) {
        throw new ConflictException('Username already exists');
      }
      user.userName = userName;
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUserByEmail = await this.userModel.findOne({ email });
      if (existingUserByEmail) {
        throw new ConflictException('Email already exists');
      }
      user.email = email;
    }

    // Save updated user
    await user.save();

    return {
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }

  async forgetPassword(forgetPasswordDto: ForgetPasswordDto): Promise<{ message: string }> {
    const { email } = forgetPasswordDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });

    // For security, don't reveal if email exists or not
    // Always return success message to prevent email enumeration
    if (!user) {
      // Still return success to prevent email enumeration attacks
      return {
        message: 'If the email exists, a temporary password has been sent to your email address.',
      };
    }

    // Generate a random temporary password (8-12 characters with mix of letters, numbers, and special chars)
    const generateTemporaryPassword = (): string => {
      const length = 10;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    };

    const temporaryPassword = generateTemporaryPassword();

    // Hash the temporary password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Send email with temporary password
    // Note: Email service will handle errors and log appropriately
    // In development mode, it will always log the temporary password
    await this.emailService.sendPasswordResetEmail(user.email, temporaryPassword);

    return {
      message: 'If the email exists, a temporary password has been sent to your email address.',
    };
  }

  async addFunds(userId: string, amount: number): Promise<{ message: string; user: { id: string; userName: string; balance: number } }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add funds to user balance
    user.balance = (parseFloat(user.balance.toString()) || 0) + amount;
    await user.save();

    // Create a payment record to track admin-added funds in totalDeposits
    const adminPayment = new this.paymentModel({
      userId: new Types.ObjectId(userId),
      amount: amount,
      currency: 'USD',
      paymentMethod: PaymentMethod.BALANCE,
      status: PaymentStatus.PAID,
      cryptomusAdditionalData: 'Admin added funds',
      paidAt: new Date(),
    });
    await adminPayment.save();

    return {
      message: 'Funds added successfully',
      user: {
        id: user._id.toString(),
        userName: user.userName,
        balance: parseFloat(user.balance.toString()),
      },
    };
  }

  async getUserFunds(userId: string): Promise<{ currentBalance: number; totalDeposits: number; minimumDeposit: number; pendingPayments: any[] }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentBalance = parseFloat(user.balance?.toString() || '0');
    
    // Calculate total deposits from all PAID payments that are for adding funds (not for purchasing leads)
    // This includes:
    // 1. Cryptomus payments (for adding funds, not lead purchases)
    // 2. Admin-added funds (marked with "Admin added funds" in additionalData)
    const depositPayments = await this.paymentModel.find({
      userId: new Types.ObjectId(userId),
      status: PaymentStatus.PAID,
      purchaseId: { $exists: false },
    }).exec();
    
    const totalDeposits = depositPayments.reduce((sum, payment) => {
      // Count payments that are:
      // - Admin added funds (has "Admin added funds" in additionalData)
      // - Cryptomus payments for adding funds (doesn't have "Lead purchase:" in additionalData)
      const additionalData = payment.cryptomusAdditionalData || '';
      if (additionalData.includes('Admin added funds') || !additionalData.includes('Lead purchase:')) {
        return sum + parseFloat(payment.amount?.toString() || '0');
      }
      return sum;
    }, 0);
    
    const minimumDeposit = 10.0; // Minimum deposit amount
    
    // Get pending payments
    const pendingPayments = await this.paymentModel.find({
      userId: new Types.ObjectId(userId),
      status: { $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
      purchaseId: { $exists: false },
    }).exec();

    return {
      currentBalance,
      totalDeposits,
      minimumDeposit,
      pendingPayments: pendingPayments.map((p: any) => ({
        _id: p._id,
        id: p._id.toString(),
        amount: p.amount,
        status: p.status,
        cryptomusAddress: p.cryptomusAddress,
        cryptomusCurrency: p.cryptomusCurrency,
        cryptomusNetwork: p.cryptomusNetwork,
        cryptomusPaymentUrl: p.cryptomusPaymentUrl,
        cryptomusExpiredAt: p.cryptomusExpiredAt,
        createdAt: p.createdAt,
      })),
    };
  }
}
