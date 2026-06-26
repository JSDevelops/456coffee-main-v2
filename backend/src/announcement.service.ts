import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IsString, IsNotEmpty, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsArray()
  @IsString({ each: true })
  targetBranches!: string[];

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsString()
  @IsOptional()
  startDate?: string | null;

  @IsString()
  @IsOptional()
  endDate?: string | null;

  @IsString()
  @IsOptional()
  responseUrl?: string | null;

  @IsString()
  @IsOptional()
  targetAudience?: string;
}

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetBranches?: string[];

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsString()
  @IsOptional()
  startDate?: string | null;

  @IsString()
  @IsOptional()
  endDate?: string | null;

  @IsString()
  @IsOptional()
  responseUrl?: string | null;

  @IsString()
  @IsOptional()
  targetAudience?: string;
}

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        targetBranches: data.targetBranches || ['ALL'],
        targetAudience: data.targetAudience || 'MANAGER',
        pinned: data.pinned ?? false,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        responseUrl: data.responseUrl || null,
      },
    });
  }

  async update(id: string, data: UpdateAnnouncementDto) {
    // Check existence
    const exists = await this.prisma.announcement.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        targetBranches: data.targetBranches,
        targetAudience: data.targetAudience,
        pinned: data.pinned,
        startDate: data.startDate !== undefined ? data.startDate : undefined,
        endDate: data.endDate !== undefined ? data.endDate : undefined,
        responseUrl: data.responseUrl !== undefined ? data.responseUrl : undefined,
      },
    });
  }

  async delete(id: string) {
    const exists = await this.prisma.announcement.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return this.prisma.announcement.delete({ where: { id } });
  }

  async getAll() {
    return this.prisma.announcement.findMany({
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getForBranch(branchId: string) {
    return this.prisma.announcement.findMany({
      where: {
        targetAudience: 'MANAGER',
        OR: [
          { targetBranches: { has: branchId } },
          { targetBranches: { has: 'ALL' } },
        ],
      },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getCustomerAnnouncements() {
    return this.prisma.announcement.findMany({
      where: {
        targetAudience: 'CUSTOMER',
      },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
}
