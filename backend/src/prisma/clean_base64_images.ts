import { prisma } from './client';

async function cleanBase64Images() {
  console.log('Sanitizing large base64 image strings in Supabase DB...');
  const products = await prisma.product.findMany();

  let cleanedCount = 0;
  for (const prod of products) {
    if (prod.image && (prod.image.startsWith('data:image/') || prod.image.length > 500)) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        },
      });
      cleanedCount++;
    }
  }

  console.log(`Cleaned ${cleanedCount} products with giant base64 strings!`);
  await prisma.$disconnect();
}

cleanBase64Images().catch(console.error);
