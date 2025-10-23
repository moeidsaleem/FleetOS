const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkScores() {
  try {
    const metrics = await prisma.driverMetrics.findMany({
      where: {
        analyticsMetrics: {
          not: null
        }
      },
      include: {
        driver: {
          select: {
            name: true,
            uberDriverId: true
          }
        }
      },
      take: 5
    });

    console.log('Driver Metrics with Analytics Data:');
    metrics.forEach(metric => {
      console.log(`Driver: ${metric.driver.name} (${metric.driver.uberDriverId})`);
      console.log(`Score: ${metric.calculatedScore}`);
      console.log(`Analytics:`, metric.analyticsMetrics);
      console.log('---');
    });

    const allMetrics = await prisma.driverMetrics.findMany({
      select: {
        calculatedScore: true,
        analyticsMetrics: true
      }
    });

    const scores = allMetrics.map(m => m.calculatedScore).filter(s => s !== null);
    console.log(`\nScore distribution:`);
    console.log(`Total metrics: ${allMetrics.length}`);
    console.log(`With scores: ${scores.length}`);
    console.log(`Average score: ${scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 'N/A'}`);
    console.log(`Min score: ${scores.length > 0 ? Math.min(...scores).toFixed(2) : 'N/A'}`);
    console.log(`Max score: ${scores.length > 0 ? Math.max(...scores).toFixed(2) : 'N/A'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkScores();
