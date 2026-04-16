import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sebs.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@sebs.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  // Create Tags
  const tagNames = [
    'Electronic', 'Concert', 'Music', 'Exhibition', 'Immersive', 'Art', 
    'Summit', 'AI', 'Technology', 'Workshop', 'Networking', 'Social'
  ];

  const tags = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    tags.push(tag);
  }

  const getTagIds = (names: string[]) => {
    return tags.filter(t => names.includes(t.name)).map(t => ({ id: t.id }));
  };

  const events = [
    {
      title: 'Neon Horizon: Digital Pulse 2024',
      description: 'A vibrant neon concert stage with crowds of people silhouetted against glowing purple and blue stage lights.',
      date: new Date('2024-10-24T21:00:00'),
      location: 'Electric Avenue Warehouse',
      category: 'Music',
      maxTickets: 500,
      price: 45.00,
      isApproved: true,
      organizerId: admin.id,
      tags: { connect: getTagIds(['Electronic', 'Concert', 'Music']) }
    },
    {
      title: 'Subtle Shifts: An Immersive Gallery',
      description: 'Minimalist modern art gallery interior with white walls, architectural shadows, and elegant visitors in soft lighting.',
      date: new Date('2024-11-02T11:00:00'),
      location: 'The Glass Pavilion, Midtown',
      category: 'Art',
      maxTickets: 100,
      price: 0,
      isApproved: true,
      organizerId: admin.id,
      tags: { connect: getTagIds(['Exhibition', 'Immersive', 'Art']) }
    },
    {
      title: 'Electric Futures: AI & Music Summit',
      description: 'High-tech conference stage with large LED screens displaying abstract geometric patterns in teal and indigo.',
      date: new Date('2024-11-15T10:00:00'),
      location: 'The Kinetic Center',
      category: 'Tech',
      maxTickets: 300,
      price: 120.00,
      isApproved: true,
      organizerId: admin.id,
      tags: { connect: getTagIds(['Summit', 'AI', 'Technology']) }
    }
  ];

  // Clean up existing events to avoid conflicts if re-seeding
  await prisma.event.deleteMany({ where: { organizerId: admin.id } });

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
