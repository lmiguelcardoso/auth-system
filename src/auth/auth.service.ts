import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './services/password.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.passwordService.hash(
      registerDto.password,
    );

    const user = this.usersRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
    });

    await this.usersRepository.save(user);

    const result = { ...user };
    delete result.password;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.verify(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.refreshTokensRepository.findOne({
      where: { token: refreshToken },
      relations: ['user', 'user.role', 'user.role.permissions'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old refresh token
    tokenRecord.revoked = true;
    await this.refreshTokensRepository.save(tokenRecord);

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.user);

    return tokens;
  }

  async logout(userId: string) {
    await this.refreshTokensRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = { ...user };
    delete result.password;
    return result;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    // Calculate expiration date
    const expiresAt = new Date();
    const days = parseInt(refreshExpiresIn.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + days);

    // Save refresh token to database
    const refreshTokenRecord = this.refreshTokensRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    await this.refreshTokensRepository.save(refreshTokenRecord);

    return {
      accessToken,
      refreshToken,
    };
  }
}
