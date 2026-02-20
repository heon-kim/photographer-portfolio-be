import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAboutDto } from './dto/update-about.dto';

const ABOUT_ROW_ID = 1;

@Injectable()
export class AboutService {
  constructor(private readonly prisma: PrismaService) {}

  getAbout() {
    return this.prisma.about.findUnique({
      where: { id: ABOUT_ROW_ID },
    });
  }

  updateAbout(updateAboutDto: UpdateAboutDto) {
    const artistName = this.validateArtistName(updateAboutDto.artistName);
    const description = this.validateDescription(updateAboutDto.description);
    const normalizedImageUrl = this.normalizeImageUrl(updateAboutDto.imageUrl);

    const updatePayload: {
      artistName: string;
      description: string;
      imageUrl?: string | null;
    } = {
      artistName,
      description,
    };

    if (normalizedImageUrl !== undefined) {
      updatePayload.imageUrl = normalizedImageUrl;
    }

    return this.prisma.about.upsert({
      where: { id: ABOUT_ROW_ID },
      update: updatePayload,
      create: {
        id: ABOUT_ROW_ID,
        artistName,
        description,
        imageUrl: normalizedImageUrl ?? null,
      },
    });
  }

  private validateArtistName(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('artistName must be a string');
    }

    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException('artistName is required');
    }

    return trimmed;
  }

  private validateDescription(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('description must be a string');
    }

    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException('description is required');
    }

    if (trimmed.length >= 100) {
      throw new BadRequestException(
        'description must be shorter than 100 characters',
      );
    }

    return trimmed;
  }

  private normalizeImageUrl(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('imageUrl must be a string or null');
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }
}
