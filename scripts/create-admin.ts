import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: ts-node scripts/create-admin.ts <email> <password>');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: { email, password: hashedPassword },
      select: { id: true, email: true, createdAt: true },
    });

    console.log('Admin ready:', admin);
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
