import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateHomeImagePresignedUrlDto } from './dto/create-home-image-presigned-url.dto';
import { UpdateHomeDto } from './dto/update-home.dto';

const HOME_ROW_ID = 1;

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  getHome() {
    return this.prisma.home.findUnique({
      where: { id: HOME_ROW_ID },
    });
  }

  async updateHeroImage(updateHomeDto: UpdateHomeDto) {
    if (!updateHomeDto || typeof updateHomeDto !== 'object') {
      throw new BadRequestException('Request body is required');
    }

    if (!Object.prototype.hasOwnProperty.call(updateHomeDto, 'heroImageUrl')) {
      throw new BadRequestException('heroImageUrl field is required');
    }

    const heroImageUrl = this.normalizeHeroImageUrl(updateHomeDto.heroImageUrl);

    return this.prisma.home.upsert({
      where: { id: HOME_ROW_ID },
      update: {
        heroImageUrl,
      },
      create: {
        id: HOME_ROW_ID,
        heroImageUrl,
      },
    });
  }

  createImageUploadUrl(dto: CreateHomeImagePresignedUrlDto) {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Request body is required');
    }

    const fileName = this.validateFileName(dto.fileName);
    const contentType = this.validateContentType(dto.contentType);
    const normalizedFileName = this.normalizeFileName(fileName);
    const objectKey = `home/${Date.now()}-${randomUUID()}-${normalizedFileName}`;

    return this.s3Service.createPresignedUploadUrl({
      key: objectKey,
      contentType,
    });
  }

  private normalizeHeroImageUrl(value: unknown) {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('heroImageUrl must be a string or null');
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  private validateFileName(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('fileName must be a string');
    }

    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException('fileName is required');
    }

    return trimmed;
  }

  private validateContentType(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('contentType must be a string');
    }

    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException('contentType is required');
    }

    if (!trimmed.toLowerCase().startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    return trimmed;
  }

  private normalizeFileName(fileName: string) {
    const withoutPath = fileName.replace(/\\/g, '/').split('/').pop() ?? fileName;
    const sanitized = withoutPath.replace(/[^a-zA-Z0-9._-]/g, '-');

    return sanitized.length > 0 ? sanitized : 'image';
  }
}
