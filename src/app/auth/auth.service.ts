import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorType } from 'src/types/ErrorType';

import { AuthLoginDto } from './dto/auth-login.dto';
import { CreateUserDto } from './dto/create-user.dto';

import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) { }

  async create(dto: CreateUserDto) {
    const existing = await this.prismaService.user.findUnique({
      where: { email: dto.email }
    })

    if (existing) {
      throw new BadRequestException(ErrorType.EmailExists)
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        password: hashedPassword
      }
    })

    delete user.password
    return user
  }

  async login(dto: AuthLoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      throw new BadRequestException(ErrorType.InvalidEmailOrPassword);
    }

    const validatePassword = await bcrypt.compare(dto.password, user.password);

    if (!validatePassword) {
      throw new BadRequestException(ErrorType.InvalidEmailOrPassword);
    }

    delete user.password
    return {
      token: this.jwtService.sign({ id: user.id, email: user.email }),
      ...user
    }
  }
}
