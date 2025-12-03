const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@photodisplay.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  console.log('Checking database...');

  // Migrate old photo paths from /uploads/ to /api/uploads/
  const photosToMigrate = await prisma.photo.findMany({
    where: {
      path: {
        startsWith: '/uploads/',
        not: {
          startsWith: '/api/uploads/'
        }
      }
    }
  });

  if (photosToMigrate.length > 0) {
    console.log(`Migrating ${photosToMigrate.length} photo path(s)...`);
    for (const photo of photosToMigrate) {
      await prisma.photo.update({
        where: { id: photo.id },
        data: { path: photo.path.replace('/uploads/', '/api/uploads/') }
      });
    }
    console.log('Photo paths migrated successfully.');
  }

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  console.log('Creating admin user...');
  
  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin.email);

  // Create default album (set as active)
  const album = await prisma.album.create({
    data: {
      name: 'Default Album',
      description: 'Default album for photos',
      isActive: true,
      userId: admin.id,
    },
  });

  console.log('Default album created:', album.name, '(active)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Database initialized successfully!');
  })
  .catch(async (e) => {
    console.error('Error initializing database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
