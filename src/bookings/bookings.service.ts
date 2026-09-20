import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import { events, bookings, users } from '../drizzle/schema';
import { CreateBookingDto } from './dto/booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: DrizzleService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBaselineBooking(customerId: number, eventId: number, dto: CreateBookingDto) {
    return this.db.db.transaction(async (tx) => {
      // 1. SELECT event
      const event = await tx.query.events.findFirst({
        where: eq(events.id, eventId)
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // 2. Check capacity in application
      if (event.bookedTickets + dto.quantity > event.capacity) {
        throw new BadRequestException('Insufficient capacity');
      }

      // 3. Create booking
      const [booking] = await tx.insert(bookings).values({
        customerId,
        eventId,
        quantity: dto.quantity,
        status: 'ACTIVE',
      }).returning().catch((e) => {
        if (e.code === '23505') { 
          throw new ConflictException('You already have a booking for this event');
        }
        throw e;
      });

      // 4. Update event inventory
      await tx.update(events)
        .set({ bookedTickets: event.bookedTickets + dto.quantity })
        .where(eq(events.id, eventId));

      // 5. Send notification
      const customer = await tx.query.users.findFirst({ where: eq(users.id, customerId) });
      if (customer) {
        await this.notificationsService.queueBookingConfirmation(customer.email, event.title, dto.quantity);
      }

      return booking;
    });
  }

  async createOptimizedBooking(customerId: number, eventId: number, dto: CreateBookingDto) {
    return this.db.db.transaction(async (tx) => {
      // 1. Atomic UPDATE with capacity check
      const [updatedEvent] = await tx.update(events)
        .set({ bookedTickets: sql`${events.bookedTickets} + ${dto.quantity}` })
        .where(
          and(
            eq(events.id, eventId),
            sql`${events.bookedTickets} + ${dto.quantity} <= ${events.capacity}`
          )
        ).returning();

      if (!updatedEvent) {
        const event = await tx.query.events.findFirst({
          where: eq(events.id, eventId)
        });
        if (!event) {
          throw new NotFoundException('Event not found');
        }
        throw new BadRequestException('Insufficient capacity');
      }

      // 2. Create booking
      const [booking] = await tx.insert(bookings).values({
        customerId,
        eventId,
        quantity: dto.quantity,
        status: 'ACTIVE',
      }).returning().catch((e) => {
        if (e.code === '23505') {
          throw new ConflictException('You already have a booking for this event');
        }
        throw e;
      });

      // 3. Send notification
      const customer = await tx.query.users.findFirst({ where: eq(users.id, customerId) });
      if (customer) {
        await this.notificationsService.queueBookingConfirmation(customer.email, updatedEvent.title, dto.quantity);
      }

      return booking;
    });
  }

  async findAll() {
    return this.db.db.query.bookings.findMany();
  }

  async findOne(id: number) {
    const booking = await this.db.db.query.bookings.findFirst({
      where: eq(bookings.id, id),
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
}
