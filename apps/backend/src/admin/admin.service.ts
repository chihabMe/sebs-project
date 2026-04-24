import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: any) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
      select: { id: true, email: true, name: true, role: true }
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isBanned: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async getPendingEvents() {
    return this.prisma.event.findMany({
      where: { isApproved: false },
      include: { organizer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveEvent(id: string) {
    return this.prisma.event.update({ where: { id }, data: { isApproved: true } });
  }

  async getStats() {
    const [userCount, eventCount, bookingCount, totalRevenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.prisma.booking.count(),
      this.prisma.event.aggregate({ _sum: { price: true } }),
    ]);

    return {
      totalUsers: userCount,
      totalEvents: eventCount,
      totalBookings: bookingCount,
      totalRevenue: totalRevenue._sum.price || 0,
    };
  }
}
