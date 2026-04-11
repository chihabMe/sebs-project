import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sebs.com' },
    update: {},
    create: {
      email: 'admin@sebs.com',
      password: 'password123', // In real life, hash this
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const events = [
    {
      title: 'Neon Horizon: Digital Pulse 2024',
      description: 'A vibrant neon concert stage with crowds of people silhouetted against glowing purple and blue stage lights.',
      date: new Date('2024-10-24T21:00:00'),
      location: 'Electric Avenue Warehouse',
      category: 'Music',
      tags: ['Electronic', 'Concert'],
      maxTickets: 500,
      price: 45.00,
      isApproved: true,
      organizerId: admin.id,
    },
    {
      title: 'Subtle Shifts: An Immersive Gallery',
      description: 'Minimalist modern art gallery interior with white walls, architectural shadows, and elegant visitors in soft lighting.',
      date: new Date('2024-11-02T11:00:00'),
      location: 'The Glass Pavilion, Midtown',
      category: 'Art',
      tags: ['Exhibition', 'Immersive'],
      maxTickets: 100,
      price: 0,
      isApproved: true,
      organizerId: admin.id,
    },
    {
      title: 'Electric Futures: AI & Music Summit',
      description: 'High-tech conference stage with large LED screens displaying abstract geometric patterns in teal and indigo.',
      date: new Date('2024-11-15T10:00:00'),
      location: 'The Kinetic Center',
      category: 'Tech',
      tags: ['Summit', 'AI'],
      maxTickets: 300,
      price: 120.00,
      isApproved: true,
      organizerId: admin.id,
    }
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
