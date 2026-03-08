import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from '../s3/s3.service';
import { CreateHomeImagePresignedUrlDto } from './dto/create-home-image-presigned-url.dto';

@Injectable()
export class HomeService {
  constructor(private readonly s3Service: S3Service) {}

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
