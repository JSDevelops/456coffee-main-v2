import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateAddressDto {
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async getByUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return this.prisma.address.findUnique({ where: { id } });
  }

  async create(userId: string, data: CreateAddressDto) {
    // If it's the first address or set as default, unset others
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const count = await this.prisma.address.count({ where: { userId } });

    return this.prisma.address.create({
      data: {
        label: data.label,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        userId,
        isDefault: data.isDefault ?? count === 0,
      },
    });
  }

  async update(id: string, userId: string, data: Partial<CreateAddressDto>) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updateData: Prisma.AddressUpdateInput = {
      label: data.label,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.isDefault,
    };

    return this.prisma.address.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.address.delete({ where: { id } });
  }
}
