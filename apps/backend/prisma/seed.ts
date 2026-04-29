import bcrypt from 'bcryptjs';
import { PrismaService } from '../src/prisma/prisma.service';

const db = new PrismaService();

async function upsertUser(email: string, data: Record<string, unknown>) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return db.user.update({ where: { id: existing.id }, data });
  }
  return db.user.create({ data: { email, ...data } });
}

async function upsertTag(name: string) {
  const existing = await db.tag.findUnique({ where: { name } });
  if (existing) return existing;
  return db.tag.create({ data: { name } });
}

async function main() {
  await db.$connect();

  const hashedPassword = await bcrypt.hash('password123', 12);
  const admin = await upsertUser('admin@sebs.com', {
    password: hashedPassword,
    name: 'System Admin',
    role: 'ADMIN',
  });

  const tagNames = [
    'Electronic',
    'Concert',
    'Music',
    'Exhibition',
    'Immersive',
    'Art',
    'Summit',
    'AI',
    'Technology',
    'Workshop',
    'Networking',
    'Social',
  ];

  const tags = await Promise.all(tagNames.map(upsertTag));
  const tagIdsFor = (names: string[]) => tags.filter((tag) => names.includes(tag.name)).map((tag) => ({ id: tag.id }));

  await db.event.deleteMany({ where: { organizerId: admin.id } });

  await db.event.create({
    data: {
      title: 'Neon Horizon: Digital Pulse 2024',
      description: 'A vibrant neon concert stage with crowds of people silhouetted against glowing purple and blue stage lights.',
      date: new Date('2024-10-24T21:00:00'),
      location: 'Electric Avenue Warehouse',
      category: 'Music',
      maxTickets: 500,
      price: 45,
      isApproved: true,
      organizerId: admin.id,
      tags: { connect: tagIdsFor(['Electronic', 'Concert', 'Music']) },
    },
  });

  await db.event.create({
    data: {
      title: 'Subtle Shifts: An Immersive Gallery',
      description: 'Minimalist modern art gallery interior with white walls, architectural shadows, and elegant visitors in soft lighting.',
      date: new Date('2024-11-02T11:00:00'),
      location: 'The Glass Pavilion, Midtown',
      category: 'Art',
      maxTickets: 100,
      price: 0,
      isApproved: true,
      organizerId: admin.id,
      tags: { connect: tagIdsFor(['Exhibition', 'Immersive', 'Art']) },
    },
  });

  await db.event.create({
    data: {
      title: 'Electric Futures: AI & Music Summit',
      description: 'High-tech conference stage with large LED screens displaying abstract geometric patterns in teal and indigo.',
      date: new Date('2024-11-15T10:00:00'),
      location: 'The Kinetic Center',
      category: 'Tech',
      maxTickets: 300,
      price: 120,
      isApproved: true,
      organizerId: admin.id,
      tags: { connect: tagIdsFor(['Summit', 'AI', 'Technology']) },
    },
  });

  console.log('Firestore seed completed. Admin login: admin@sebs.com / password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
