const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearMetrics() {
  try {
    // Clear all existing driver metrics
    const result = await prisma.driverMetrics.deleteMany({});
    console.log(`Cleared ${result.count} driver metrics`);
    
    // Check if any metrics remain
    const remaining = await prisma.driverMetrics.count();
    console.log(`Remaining metrics: ${remaining}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearMetrics();
