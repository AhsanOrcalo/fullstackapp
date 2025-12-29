import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enquiry, EnquiryDocument, EnquiryStatus } from './schemas/enquiry.schema';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { RespondEnquiryDto } from './dto/respond-enquiry.dto';

@Injectable()
export class EnquiriesService {
  constructor(
    @InjectModel(Enquiry.name)
    private enquiryModel: Model<EnquiryDocument>,
  ) {}

  async createEnquiry(userId: string, createEnquiryDto: CreateEnquiryDto): Promise<EnquiryDocument> {
    const enquiry = new this.enquiryModel({
      userId: new Types.ObjectId(userId),
      message: createEnquiryDto.message,
      status: EnquiryStatus.PENDING,
    });

    return enquiry.save();
  }

  async getUserEnquiries(userId: string): Promise<EnquiryDocument[]> {
    return this.enquiryModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('userId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllEnquiries(): Promise<EnquiryDocument[]> {
    return this.enquiryModel
      .find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getEnquiryById(id: string): Promise<EnquiryDocument | null> {
    return this.enquiryModel
      .findById(id)
      .populate('userId')
      .exec();
  }

  async respondToEnquiry(
    enquiryId: string,
    adminId: string,
    respondEnquiryDto: RespondEnquiryDto,
  ): Promise<EnquiryDocument> {
    const enquiry = await this.enquiryModel.findById(enquiryId);

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    enquiry.adminResponse = respondEnquiryDto.response;
    enquiry.respondedBy = new Types.ObjectId(adminId);
    enquiry.status = EnquiryStatus.RESPONDED;
    enquiry.updatedAt = new Date();

    return enquiry.save();
  }

  async closeEnquiry(enquiryId: string, userId: string): Promise<EnquiryDocument> {
    const enquiry = await this.enquiryModel.findById(enquiryId);

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    if (enquiry.userId.toString() !== userId) {
      throw new UnauthorizedException('You can only close your own enquiries');
    }

    enquiry.status = EnquiryStatus.CLOSED;
    enquiry.updatedAt = new Date();

    return enquiry.save();
  }
}
