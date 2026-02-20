import { PrismaClient } from '@prisma/client';

const DEFAULT_ARTIST_NAME = 'Sample Artist';
const DEFAULT_DESCRIPTION = '사진작가 소개 문구 (100자 미만)';
const HARDCODED_IMAGE_URL =
  'https://phtograph.netlify.app/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1500530855697-b586d89ba3ee%3Fauto%3Dformat%26fit%3Dcrop%26w%3D2400%26q%3D80&w=1920&q=75';
const ABOUT_ROW_ID = 1;

async function main() {
  const [artistNameArg, descriptionArg] = process.argv.slice(2);

  const artistName = (artistNameArg ?? DEFAULT_ARTIST_NAME).trim();
  const description = (descriptionArg ?? DEFAULT_DESCRIPTION).trim();

  if (!artistName) {
    console.error('artistName is required (non-empty string)');
    process.exit(1);
  }

  if (!description || description.length >= 100) {
    console.error('description is required and must be shorter than 100 chars');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const imageUrl = HARDCODED_IMAGE_URL;

    const about = await prisma.about.upsert({
      where: { id: ABOUT_ROW_ID },
      update: {
        artistName,
        description,
        imageUrl,
      },
      create: {
        id: ABOUT_ROW_ID,
        artistName,
        description,
        imageUrl,
      },
      select: {
        id: true,
        artistName: true,
        description: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    console.log('About row ready:', about);
  } catch (error) {
    console.error('Failed to seed about row:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
