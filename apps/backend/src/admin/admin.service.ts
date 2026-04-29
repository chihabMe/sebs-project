import { Injectable, Logger } from '@nestjs/common';
import { type Role } from '@sebs/shared';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserByAdminDto, UpdateUserByAdminDto } from './dto/admin.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { PendingEventsQueryDto } from './dto/pending-events-query.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  private logAudit(action: string, actorId: string | undefined, target: string, meta?: Record<string, unknown>) {
    this.logger.log(
      JSON.stringify({
        scope: 'admin_audit',
        action,
        actorId: actorId ?? 'unknown',
        target,
        ...meta,
      }),
    );
  }

  async createUser(dto: CreateUserByAdminDto, actorId?: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const createdUser = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name.trim(),
        role: dto.role ?? 'USER',
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true, role: true }
    });

    this.logAudit('create_user', actorId, createdUser.id, { role: createdUser.role });
    return createdUser;
  }

  async getUsers(query: AdminUsersQueryDto = {}) {
    const args: any = {
      select: { id: true, email: true, name: true, role: true, isBanned: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    };

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role as Role;
    }

    if (typeof query.isBanned === 'boolean') {
      where.isBanned = query.isBanned;
    }

    if (Object.keys(where).length > 0) {
      args.where = where;
    }

    if (query.sortBy) {
      const order = query.sortOrder ?? (query.sortBy === 'createdAt' ? 'desc' : 'asc');
      args.orderBy = { [query.sortBy]: order };
    }

    if (query.page && query.limit) {
      args.skip = (query.page - 1) * query.limit;
      args.take = query.limit;
    }

    return this.prisma.user.findMany(args);
  }

  async updateUser(id: string, data: UpdateUserByAdminDto, actorId?: string) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(typeof data.isBanned === 'boolean' ? { isBanned: data.isBanned } : {}),
      },
      select: { id: true, email: true, name: true, role: true, isBanned: true, createdAt: true },
    });

    this.logAudit('update_user', actorId, updatedUser.id, {
      role: updatedUser.role,
      isBanned: updatedUser.isBanned,
    });
    return updatedUser;
  }

  async getPendingEvents(query: PendingEventsQueryDto = {}) {
    const where: any = {
      isApproved: false,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
        { organizer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const args: any = {
      where,
      include: { organizer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    };

    if (query.page && query.limit) {
      args.skip = (query.page - 1) * query.limit;
      args.take = query.limit;
    }

    return this.prisma.event.findMany(args);
  }

  async approveEvent(id: string, actorId?: string) {
    const event = await this.prisma.event.update({ where: { id }, data: { isApproved: true } });
    this.logAudit('approve_event', actorId, event.id);
    return event;
  }

  async rejectEvent(id: string, actorId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, isApproved: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.isApproved) {
      throw new BadRequestException('Only pending events can be rejected');
    }

    const rejectedEvent = await this.prisma.event.update({
      where: { id },
      data: { isApproved: false, status: 'CANCELLED' },
    });

    this.logAudit('reject_event', actorId, rejectedEvent.id);
    return rejectedEvent;
  }

  async getStats() {
    const [userCount, eventCount, bookingCount, totalRevenue, pendingEvents, bannedUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.prisma.booking.count(),
      this.prisma.event.aggregate({ _sum: { price: true } }),
      this.prisma.event.count({ where: { isApproved: false } }),
      this.prisma.user.count({ where: { isBanned: true } }),
    ]);

    return {
      totalUsers: userCount,
      totalEvents: eventCount,
      totalBookings: bookingCount,
      totalRevenue: totalRevenue._sum.price || 0,
      pendingEvents,
      bannedUsers,
    };
  }
}
