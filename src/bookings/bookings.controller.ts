import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Standard endpoint, defaults to optimized in production
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Post('events/:eventId/bookings')
  createBooking(
    @Req() req: any, 
    @Param('eventId', ParseIntPipe) eventId: number, 
    @Body() createBookingDto: CreateBookingDto
  ) {
    return this.bookingsService.createOptimizedBooking(req.user.sub, eventId, createBookingDto);
  }

  // Benchmark: Baseline Endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Post('api/initial/events/:eventId/bookings')
  createInitialBooking(
    @Req() req: any, 
    @Param('eventId', ParseIntPipe) eventId: number, 
    @Body() createBookingDto: CreateBookingDto
  ) {
    return this.bookingsService.createBaselineBooking(req.user.sub, eventId, createBookingDto);
  }

  // Benchmark: Optimized Endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Post('api/optimized/events/:eventId/bookings')
  createOptimizedBooking(
    @Req() req: any, 
    @Param('eventId', ParseIntPipe) eventId: number, 
    @Body() createBookingDto: CreateBookingDto
  ) {
    return this.bookingsService.createOptimizedBooking(req.user.sub, eventId, createBookingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings')
  findAll() {
    return this.bookingsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }
}
