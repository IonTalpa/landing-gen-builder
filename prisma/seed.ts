import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a sample project for development
  const sampleProject = await prisma.project.upsert({
    where: { slug: 'sample-landing' },
    update: {},
    create: {
      name: 'Sample Landing Page',
      slug: 'sample-landing',
      sector: 'Technology',
      locale: 'tr',
      styleTags: ['modern', 'minimal', 'tech'],
      brand: {
        create: {
          primary: '#3b82f6',
          secondary: '#10b981',
          palette: [
            { slug: 'primary', color: '#3b82f6', locked: false, source: 'user' },
            { slug: 'secondary', color: '#10b981', locked: false, source: 'user' },
            { slug: 'accent', color: '#f59e0b', locked: false, source: 'user' },
            { slug: 'neutral', color: '#6b7280', locked: false, source: 'user' },
          ],
          headingFont: { 
            family: 'Inter', 
            weights: [400, 600, 700],
            fallback: 'system-ui, sans-serif'
          },
          bodyFont: { 
            family: 'System UI', 
            weights: [400, 500],
            fallback: 'system-ui, -apple-system, sans-serif'
          },
        },
      },
      content: {
        create: {
          headline: 'Build Amazing Landing Pages',
          benefits: [
            { title: 'Fast Performance', description: 'Optimized for speed and conversion' },
            { title: 'Mobile First', description: 'Responsive design that works everywhere' },
            { title: 'SEO Ready', description: 'Built with search engines in mind' },
          ],
          cta: 'Get Started Today',
          contact: {
            phone: '+90 555 123 4567',
            whatsapp: '+90 555 123 4567',
            address: 'Istanbul, Turkey',
          },
        },
      },
      layout: {
        create: {
          sections: ['header', 'hero', 'benefits', 'about', 'contact', 'footer'],
        },
      },
    },
  });

  console.log('✅ Sample project created:', sampleProject.name);
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });