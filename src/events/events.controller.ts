import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Post()
  create(@Req() req: any, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(req.user.sub, createEventDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Get('my')
  findMyEvents(@Req() req: any) {
    return this.eventsService.findMyEvents(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto
  ) {
    return this.eventsService.update(id, req.user.sub, updateEventDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Get(':id/bookings')
  getEventBookings(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getEventBookings(id, req.user.sub);
  }
}
