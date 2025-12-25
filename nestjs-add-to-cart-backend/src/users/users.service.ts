import { Injectable, ConflictException, UnauthorizedException, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  private users: User[] = []; // In-memory storage, replace with database later

  constructor(private jwtService: JwtService) {}

  async onModuleInit() {
    // Create initial admin user on service initialization
    await this.createInitialAdmin();
  }

  private async createInitialAdmin() {
    // Check if admin already exists
    const adminExists = this.users.some((u) => u.role === Role.ADMIN);
    if (adminExists) {
      return;
    }

    // Create default admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds); // Change this password in production

    const adminUser: User = {
      id: 'admin-' + Date.now().toString(),
      userName: 'admin',
      email: 'admin@example.com',
      phoneNumber: '+1234567890',
      password: hashedPassword,
      role: Role.ADMIN,
      createdAt: new Date(),
    };

    this.users.push(adminUser);
    console.log('Initial admin user created. Username: admin, Password: admin123');
  }

  async register(registerDto: RegisterDto): Promise<{ message: string; user: { id: string; userName: string; email: string; phoneNumber: string; role: Role } }> {
    const { userName, email, phoneNumber, password, confirmPassword } = registerDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    // Check if username already exists
    const existingUserByUsername = this.users.find((u) => u.userName === userName);
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists
    const existingUserByEmail = this.users.find((u) => u.email === email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone number already exists
    const existingUserByPhone = this.users.find((u) => u.phoneNumber === phoneNumber);
    if (existingUserByPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with default role 'user'
    const newUser: User = {
      id: Date.now().toString(),
      userName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: Role.USER, // Default role is 'user'
      createdAt: new Date(),
    };

    this.users.push(newUser);

    return {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
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
    const user = this.users.find((u) => u.userName === userName);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token with role included
    const payload = { sub: user.id, userName: user.userName, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        userName: user.userName,
        role: user.role,
      },
    };
  }

  async findOneById(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

    // Find user
    const user = this.users.find((u) => u.id === userId);
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

    return {
      message: 'Password changed successfully',
    };
  }

  async getAllUsers(): Promise<{ id: string; userName: string; email: string; phoneNumber: string; role: Role; createdAt: Date }[]> {
    // Return all users without password field, excluding admin users
    return this.users
      .filter((user) => user.role !== Role.ADMIN)
      .map(({ password, ...user }) => user);
  }
}

