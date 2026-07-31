import { PrismaClient } from '@prisma/client';

// Evita criar uma nova conexão a cada hot-reload do Next.js em dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
