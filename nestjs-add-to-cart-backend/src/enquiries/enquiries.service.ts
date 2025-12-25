import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enquiry, EnquiryStatus } from './entities/enquiry.entity';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { RespondEnquiryDto } from './dto/respond-enquiry.dto';

@Injectable()
export class EnquiriesService {
  constructor(
    @InjectRepository(Enquiry)
    private enquiriesRepository: Repository<Enquiry>,
  ) {}

  async createEnquiry(userId: string, createEnquiryDto: CreateEnquiryDto): Promise<Enquiry> {
    const enquiry = this.enquiriesRepository.create({
      userId,
      message: createEnquiryDto.message,
      status: EnquiryStatus.PENDING,
    });

    return this.enquiriesRepository.save(enquiry);
  }

  async getUserEnquiries(userId: string): Promise<Enquiry[]> {
    return this.enquiriesRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllEnquiries(): Promise<Enquiry[]> {
    return this.enquiriesRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEnquiryById(id: string): Promise<Enquiry | null> {
    return this.enquiriesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async respondToEnquiry(
    enquiryId: string,
    adminId: string,
    respondEnquiryDto: RespondEnquiryDto,
  ): Promise<Enquiry> {
    const enquiry = await this.enquiriesRepository.findOne({
      where: { id: enquiryId },
    });

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    enquiry.adminResponse = respondEnquiryDto.response;
    enquiry.respondedBy = adminId;
    enquiry.status = EnquiryStatus.RESPONDED;
    enquiry.updatedAt = new Date();

    return this.enquiriesRepository.save(enquiry);
  }

  async closeEnquiry(enquiryId: string, userId: string): Promise<Enquiry> {
    const enquiry = await this.enquiriesRepository.findOne({
      where: { id: enquiryId },
    });

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    if (enquiry.userId !== userId) {
      throw new UnauthorizedException('You can only close your own enquiries');
    }

    enquiry.status = EnquiryStatus.CLOSED;
    enquiry.updatedAt = new Date();

    return this.enquiriesRepository.save(enquiry);
  }
}

