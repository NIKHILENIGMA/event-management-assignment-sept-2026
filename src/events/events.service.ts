import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import { events, bookings } from '../drizzle/schema';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly db: DrizzleService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(organizerId: number, dto: CreateEventDto) {
    const [event] = await this.db.db.insert(events).values({
      organizerId,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      capacity: dto.capacity,
    }).returning();
    return event;
  }

  async findAll() {
    return this.db.db.query.events.findMany();
  }

  async findOne(id: number) {
    const event = await this.db.db.query.events.findFirst({
      where: eq(events.id, id),
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async findMyEvents(organizerId: number) {
    return this.db.db.query.events.findMany({
      where: eq(events.organizerId, organizerId),
    });
  }

  async update(id: number, organizerId: number, dto: UpdateEventDto) {
    const event = await this.findOne(id);
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only update your own events');
    }

    const updates: any = {};
    if (dto.title) updates.title = dto.title;
    if (dto.description) updates.description = dto.description;
    if (dto.location) updates.location = dto.location;
    if (dto.startAt) updates.startAt = new Date(dto.startAt);
    if (dto.endAt) updates.endAt = new Date(dto.endAt);
    if (dto.capacity) updates.capacity = dto.capacity;
    updates.updatedAt = new Date();

    const [updatedEvent] = await this.db.db.update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();

    // 11. Add event-update notifications
    const activeBookings = await this.db.db.query.bookings.findMany({
      where: and(eq(bookings.eventId, id), eq(bookings.status, 'ACTIVE')),
      with: {
        customer: true,
      }
    });

    for (const b of activeBookings) {
      if (b.customer) {
        await this.notificationsService.queueEventUpdateNotification(b.customer.email, updatedEvent.title);
      }
    }

    return updatedEvent;
  }

  async remove(id: number, organizerId: number) {
    const event = await this.findOne(id);
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.db.db.delete(events).where(eq(events.id, id));
    return { success: true };
  }

  async getEventBookings(eventId: number, organizerId: number) {
    const event = await this.findOne(eventId);
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only view bookings for your own events');
    }

    return this.db.db.query.bookings.findMany({
      where: eq(bookings.eventId, eventId),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }
}
