import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import { users } from '../drizzle/schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DrizzleService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.db.db.query.users.findFirst({
      where: eq(users.email, dto.email),
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await argon2.hash(dto.password);

    const [newUser] = await this.db.db.insert(users).values({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    }).returning();

    return this.generateTokens(newUser.id, newUser.email, newUser.role);
  }

  async login(dto: LoginDto) {
    const user = await this.db.db.query.users.findFirst({
      where: eq(users.email, dto.email),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(userId: number, email: string, role: string) {
    return this.generateTokens(userId, email, role);
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
