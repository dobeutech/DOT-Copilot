import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup before all tests
  process.env.JWT_SECRET = 'test-secret-key-32-characters-minimum';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters';
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Cleanup after all tests
  await prisma.$disconnect();
});

// Clear database between test suites if needed
beforeEach(async () => {
  // Optional: Clear test data before each test
});

export { prisma };

