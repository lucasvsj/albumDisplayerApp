import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@photodisplay.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.')
    return
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log('Admin user created:', admin.email)

  // Create default album
  const album = await prisma.album.create({
    data: {
      name: 'Default Album',
      description: 'Default album for photos',
      userId: admin.id,
    },
  })

  console.log('Default album created:', album.name)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
