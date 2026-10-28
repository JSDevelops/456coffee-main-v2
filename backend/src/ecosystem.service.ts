import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export class CreateAcademyEnrollmentDto {
  studentName: string;
  phone: string;
  lineId?: string;
  courseTrack?: string;
  planStatus?: string;
  preferredDate?: string;
  notes?: string;
}

export class CreatePlantationBookingDto {
  farmerName: string;
  phone: string;
  lineId?: string;
  saplingCount?: number;
  landArea?: string;
  subdistrict?: string;
  district: string;
  province?: string;
  gpsLocation?: string;
  latitude?: number;
  longitude?: number;
  experienceLevel?: string;
}

export class UpsertLocationDto {
  type: string; // CAFE | PLANTATION | ACADEMY | PARTNER
  name: string;
  badge?: string;
  district: string;
  province?: string;
  latitude: number;
  longitude: number;
  hoursOrCapacity?: string;
  phone?: string;
  details?: string;
  stats?: string;
  actionText?: string;
  actionHref?: string;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class EcosystemService implements OnModuleInit {
  private readonly logger = new Logger(EcosystemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultLocationsIfEmpty();
  }

  // ════════════════════════════════════════════════════════════════════════
  // 1. Academy Enrollments
  // ════════════════════════════════════════════════════════════════════════

  async createAcademyEnrollment(dto: CreateAcademyEnrollmentDto) {
    if (!dto.studentName || !dto.phone) {
      throw new Error('กรุณาระบุชื่อ-นามสกุลและเบอร์โทรศัพท์');
    }

    const cleanPhone = dto.phone.replace(/[^0-9]/g, '');

    const enrollment = await this.prisma.academyEnrollment.create({
      data: {
        studentName: dto.studentName.trim(),
        phone: cleanPhone,
        lineId: dto.lineId?.trim() || null,
        courseTrack: dto.courseTrack || 'COMPLETE_SOLUTION',
        planStatus: dto.planStatus || null,
        preferredDate: dto.preferredDate?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: 'PENDING',
      },
    });

    this.logger.log(`New Academy Enrollment: ${enrollment.studentName} (${enrollment.phone})`);
    return enrollment;
  }

  async getAcademyEnrollments(query?: { search?: string; status?: string; courseTrack?: string }) {
    const where: any = {};

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query?.courseTrack && query.courseTrack !== 'ALL') {
      where.courseTrack = query.courseTrack;
    }

    if (query?.search) {
      where.OR = [
        { studentName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { lineId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.academyEnrollment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAcademyEnrollment(
    id: string,
    data: { status?: string; batchNo?: number; adminNotes?: string },
  ) {
    return this.prisma.academyEnrollment.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.batchNo !== undefined && { batchNo: data.batchNo }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
      },
    });
  }

  async deleteAcademyEnrollment(id: string) {
    return this.prisma.academyEnrollment.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. Plantation & Seedling Bookings
  // ════════════════════════════════════════════════════════════════════════

  async createPlantationBooking(dto: CreatePlantationBookingDto) {
    if (!dto.farmerName || !dto.phone) {
      throw new Error('กรุณาระบุชื่อเกษตรกรและเบอร์โทรศัพท์');
    }

    const cleanPhone = dto.phone.replace(/[^0-9]/g, '');

    // Parse GPS if provided as text "lat, lng"
    let lat: number | undefined = dto.latitude;
    let lng: number | undefined = dto.longitude;

    if (dto.gpsLocation && (!lat || !lng)) {
      const match = dto.gpsLocation.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }

    // Generate unique Farm Code e.g. PP-4821
    const farmCode = `PP-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking = await this.prisma.plantationBooking.create({
      data: {
        farmCode,
        farmerName: dto.farmerName.trim(),
        phone: cleanPhone,
        lineId: dto.lineId?.trim() || null,
        saplingCount: Number(dto.saplingCount) || 300,
        landArea: dto.landArea || '1 ไร่',
        subdistrict: dto.subdistrict?.trim() || null,
        district: dto.district?.trim() || 'อ.เมือง',
        province: dto.province?.trim() || 'กาฬสินธุ์',
        latitude: lat || null,
        longitude: lng || null,
        gpsRaw: dto.gpsLocation?.trim() || null,
        status: 'BOOKED',
        isPublicOnMap: false,
      },
    });

    this.logger.log(`New Plantation Booking: ${booking.farmCode} - ${booking.farmerName} (${booking.saplingCount} saplings)`);
    return booking;
  }

  async getPlantationBookings(query?: { search?: string; status?: string; province?: string }) {
    const where: any = {};

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query?.province && query.province !== 'ALL') {
      where.province = query.province;
    }

    if (query?.search) {
      where.OR = [
        { farmCode: { contains: query.search, mode: 'insensitive' } },
        { farmerName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { district: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.plantationBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePlantationBooking(
    id: string,
    data: {
      status?: string;
      saplingCount?: number;
      isPublicOnMap?: boolean;
      adminNotes?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.prisma.plantationBooking.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.saplingCount !== undefined && { saplingCount: Number(data.saplingCount) }),
        ...(data.isPublicOnMap !== undefined && { isPublicOnMap: data.isPublicOnMap }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
      },
    });
  }

  async deletePlantationBooking(id: string) {
    return this.prisma.plantationBooking.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 3. Ecosystem Locations (Map Pins)
  // ════════════════════════════════════════════════════════════════════════

  async getPublicLocations() {
    // 1. Static/configured locations in EcosystemLocation
    const configuredLocations = await this.prisma.ecosystemLocation.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // 2. Approved plantation bookings marked isPublicOnMap
    const approvedFarms = await this.prisma.plantationBooking.findMany({
      where: { isPublicOnMap: true, latitude: { not: null }, longitude: { not: null } },
    });

    const farmPins = approvedFarms.map((farm) => ({
      id: `farm-${farm.id}`,
      type: 'plantation',
      name: `แปลงกาแฟโรบัสต้า (${farm.farmCode})`,
      badge: `เครือข่ายภูพาน (${farm.landArea || '1 ไร่'})`,
      district: farm.district,
      province: farm.province,
      latitude: farm.latitude!,
      longitude: farm.longitude!,
      hoursOrCapacity: `ปลูก ${farm.saplingCount} ต้น`,
      phone: undefined, // Hide private farmer phone on public map
      details: `แปลงปลูกสมาชิกเครือข่ายกาแฟโรบัสต้าภูพาน ${farm.district} จ.${farm.province}`,
      stats: 'สมาชิกเครือข่าย 456',
      actionText: 'จองต้นพันธุ์แปลงใกล้เคียง',
      actionHref: '#plantations',
      isActive: true,
      sortOrder: 10,
    }));

    return [...configuredLocations, ...farmPins];
  }

  async getAllLocations() {
    return this.prisma.ecosystemLocation.findMany({
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async createLocation(dto: UpsertLocationDto) {
    return this.prisma.ecosystemLocation.create({
      data: {
        type: dto.type.toUpperCase(),
        name: dto.name.trim(),
        badge: dto.badge?.trim() || null,
        district: dto.district.trim(),
        province: dto.province?.trim() || 'กาฬสินธุ์',
        latitude: Number(dto.latitude),
        longitude: Number(dto.longitude),
        hoursOrCapacity: dto.hoursOrCapacity?.trim() || null,
        phone: dto.phone?.trim() || null,
        details: dto.details?.trim() || null,
        stats: dto.stats?.trim() || null,
        actionText: dto.actionText?.trim() || null,
        actionHref: dto.actionHref?.trim() || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async updateLocation(id: string, dto: Partial<UpsertLocationDto>) {
    return this.prisma.ecosystemLocation.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type.toUpperCase() }),
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.badge !== undefined && { badge: dto.badge?.trim() || null }),
        ...(dto.district && { district: dto.district.trim() }),
        ...(dto.province && { province: dto.province.trim() }),
        ...(dto.latitude !== undefined && { latitude: Number(dto.latitude) }),
        ...(dto.longitude !== undefined && { longitude: Number(dto.longitude) }),
        ...(dto.hoursOrCapacity !== undefined && { hoursOrCapacity: dto.hoursOrCapacity }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.details !== undefined && { details: dto.details }),
        ...(dto.stats !== undefined && { stats: dto.stats }),
        ...(dto.actionText !== undefined && { actionText: dto.actionText }),
        ...(dto.actionHref !== undefined && { actionHref: dto.actionHref }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteLocation(id: string) {
    return this.prisma.ecosystemLocation.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 4. Ecosystem Dashboard Stats
  // ════════════════════════════════════════════════════════════════════════

  async getEcosystemStats() {
    const [totalEnrollments, pendingEnrollments, confirmedEnrollments] = await Promise.all([
      this.prisma.academyEnrollment.count(),
      this.prisma.academyEnrollment.count({ where: { status: 'PENDING' } }),
      this.prisma.academyEnrollment.count({ where: { status: { in: ['CONFIRMED', 'PAID', 'COMPLETED'] } } }),
    ]);

    const [totalBookings, pendingBookings, saplingsAggregate] = await Promise.all([
      this.prisma.plantationBooking.count(),
      this.prisma.plantationBooking.count({ where: { status: 'BOOKED' } }),
      this.prisma.plantationBooking.aggregate({ _sum: { saplingCount: true } }),
    ]);

    const totalLocations = await this.prisma.ecosystemLocation.count({ where: { isActive: true } });

    return {
      academy: {
        total: totalEnrollments,
        pending: pendingEnrollments,
        confirmed: confirmedEnrollments,
      },
      plantations: {
        totalFarmers: totalBookings,
        pendingBookings: pendingBookings,
        totalSaplings: saplingsAggregate._sum.saplingCount || 0,
      },
      locations: {
        activePins: totalLocations,
      },
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // 5. Initial Seed
  // ════════════════════════════════════════════════════════════════════════

  private async seedDefaultLocationsIfEmpty() {
    try {
      const count = await this.prisma.ecosystemLocation.count();
      if (count > 0) return;

      this.logger.log('Seeding initial 456 Coffee Ecosystem locations...');

      const defaultPins: UpsertLocationDto[] = [
        {
          type: 'CAFE',
          name: '456 Coffee สาขาหลัก เมืองกาฬสินธุ์',
          badge: 'Flagship Cafe & Roastery',
          district: 'อ.เมือง',
          province: 'กาฬสินธุ์',
          latitude: 16.4322,
          longitude: 103.5061,
          hoursOrCapacity: '08:30 - 16:30 น. (เปิดทุกวัน)',
          phone: '061-305-5625',
          details: 'บาร์กาแฟสดโรบัสต้าภูพาน มี Slow Bar คั่วสด มีพื้นที่นั่งทำงาน และจำหน่ายเมล็ดกาแฟ',
          stats: 'ยอดนิยม 2,500+ แก้ว/เดือน',
          actionText: 'ดูข้อมูลร้าน & โทรสั่ง',
          actionHref: '#cafes',
          isActive: true,
          sortOrder: 1,
        },
        {
          type: 'CAFE',
          name: '456 Coffee สาขา ศูนย์ OTOP กาฬสินธุ์',
          badge: 'Tourist & Gift Station',
          district: 'อ.เมือง',
          province: 'กาฬสินธุ์',
          latitude: 16.4410,
          longitude: 103.5180,
          hoursOrCapacity: '07:00 - 17:00 น. (เปิดทุกวัน)',
          phone: '061-305-5625',
          details: 'จุดแวะพักนักท่องเที่ยว ของฝากกาแฟภูพาน ขนมเบเกอรี่ และผลิตภัณฑ์ผ้าไหมแพรวา',
          stats: 'บริการรวดเร็ว Takeaway',
          actionText: 'ดูข้อมูลสาขา',
          actionHref: '#cafes',
          isActive: true,
          sortOrder: 2,
        },
        {
          type: 'PLANTATION',
          name: 'แปลงต้นแบบโรบัสต้า เทือกเขาภูพาน',
          badge: 'Certified Model Farm',
          district: 'อ.สมเด็จ',
          province: 'กาฬสินธุ์',
          latitude: 16.7012,
          longitude: 103.7541,
          hoursOrCapacity: 'เนื้อที่ 30 ไร่ (6,000 ต้น)',
          phone: '061-305-5625',
          details: 'แปลงปลูกระดับความสูงธรรมชาติ ดินภูเขาแร่ธาตุสูง คัดเก็บผลสุก Hand Picked 100%',
          stats: 'ผลผลิต 12+ ตัน/ปี',
          actionText: 'จองต้นพันธุ์จากแปลงนี้',
          actionHref: '#plantations',
          isActive: true,
          sortOrder: 3,
        },
        {
          type: 'ACADEMY',
          name: '456 Coffee Academy & Barista School',
          badge: 'Main Training Campus',
          district: 'อ.เมือง',
          province: 'กาฬสินธุ์',
          latitude: 16.4350,
          longitude: 103.5100,
          hoursOrCapacity: 'รองรับรุ่นละ 8 - 12 ท่าน',
          phone: '061-305-5625',
          details: 'ศูนย์อบรมหลักสูตรบาริสต้ามืออาชีพ และการบริหารจัดการร้านคาเฟ่ครบวงจร พร้อมห้องแล็บเครื่องชงและอุปกรณ์จริง',
          stats: 'ผู้สำเร็จการศึกษา 150+ คน',
          actionText: 'ลงทะเบียนเรียนเปิดร้าน',
          actionHref: '#academy',
          isActive: true,
          sortOrder: 4,
        },
      ];

      for (const pin of defaultPins) {
        await this.createLocation(pin);
      }
      this.logger.log('Initial Ecosystem locations seeded successfully.');
    } catch (err) {
      this.logger.warn(`Could not seed ecosystem locations: ${err.message}`);
    }
  }
}
