import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { WorksRepository } from './works.repository';
import { ListWorksQueryDto } from './dto/list-works-query.dto';
import { CreateWorkImagePresignedUrlDto } from './dto/create-work-image-presigned-url.dto';
import { S3Service } from '../s3/s3.service';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

@Injectable()
export class WorksService {
  private readonly bucketPublicBaseUrl =
    this.resolveBucketPublicBaseUrl() ?? null;

  constructor(
    private readonly worksRepository: WorksRepository,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(query: ListWorksQueryDto) {
    const limit = this.resolveLimit(query.limit);
    const cursor = query.cursor;

    if (cursor !== undefined) {
      await this.ensureCursorExists(cursor);
    }

    return this.worksRepository.findMany({
      limit,
      cursor,
    });
  }

  async findOne(id: number) {
    const work = await this.worksRepository.findById(id);

    if (!work) {
      throw new NotFoundException('Work not found');
    }

    return work;
  }

  async create(createWorkDto: CreateWorkDto) {
    const payload = {
      title: createWorkDto.title,
      year: createWorkDto.year,
      thumbnailUrl: this.normalizeOptionalImageUrl(
        createWorkDto.thumbnailUrl ?? undefined,
      ),
      imageUrls: this.normalizeImageUrlArray(createWorkDto.imageUrls),
    };

    return this.worksRepository.create(payload);
  }

  async update(id: number, updateWorkDto: UpdateWorkDto) {
    const payload = this.buildUpdatePayload(updateWorkDto);

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    return this.worksRepository.update(id, payload);
  }

  async remove(id: number) {
    await this.worksRepository.delete(id);
  }

  createImagePresignedUrl(dto: CreateWorkImagePresignedUrlDto) {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Request body is required');
    }

    const fileName = this.validateFileName(dto.fileName);
    const contentType = this.validateContentType(dto.contentType);
    const normalizedFileName = this.normalizeFileName(fileName);
    const objectKey = `works/${Date.now()}-${randomUUID()}-${normalizedFileName}`;

    return this.s3Service.createPresignedUploadUrl({
      key: objectKey,
      contentType,
    });
  }

  private async ensureCursorExists(cursor: number) {
    const reference = await this.worksRepository.findById(cursor);

    if (!reference) {
      throw new NotFoundException('Cursor points to a missing work');
    }
  }

  private resolveLimit(requested?: number) {
    const fallback = DEFAULT_LIMIT;

    if (requested === undefined) {
      return fallback;
    }

    return Math.min(requested, MAX_LIMIT);
  }

  private buildUpdatePayload(updateDto: UpdateWorkDto) {
    const payload: Prisma.WorkUpdateInput = {};

    if (updateDto.title !== undefined) {
      payload.title = updateDto.title;
    }

    if (updateDto.year !== undefined) {
      payload.year = updateDto.year;
    }

    if (updateDto.thumbnailUrl !== undefined) {
      payload.thumbnailUrl = this.normalizeOptionalImageUrl(
        updateDto.thumbnailUrl,
      );
    }

    if (updateDto.imageUrls !== undefined) {
      payload.imageUrls = {
        set: this.normalizeImageUrlArray(updateDto.imageUrls),
      };
    }

    return payload;
  }

  private normalizeOptionalImageUrl(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = value.trim();

    return this.ensureUploadUrl(normalized, 'thumbnailUrl');
  }

  private normalizeImageUrlArray(values?: string[]) {
    if (values === undefined) {
      return undefined;
    }

    if (!Array.isArray(values)) {
      throw new BadRequestException('imageUrls must be an array');
    }

    if (values.length === 0) {
      throw new BadRequestException('imageUrls must contain at least one url');
    }

    return values.map((url, index) => {
      if (typeof url !== 'string') {
        throw new BadRequestException(
          `imageUrls[${index}] must be a string url`,
        );
      }

      return this.ensureUploadUrl(url, `imageUrls[${index}]`);
    });
  }

  private ensureUploadUrl(value: string, fieldName: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    if (
      this.bucketPublicBaseUrl &&
      !normalized.startsWith(`${this.bucketPublicBaseUrl}/`)
    ) {
      throw new BadRequestException(
        `${fieldName} must come from the presigned upload URL`,
      );
    }

    return normalized;
  }

  private resolveBucketPublicBaseUrl() {
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;

    if (!bucketName || !region) {
      return null;
    }

    return `https://${bucketName}.s3.${region}.amazonaws.com`;
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
