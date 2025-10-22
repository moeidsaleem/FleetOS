#!/usr/bin/env tsx

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASS

    if (!adminEmail || !adminPassword) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASS environment variables are required')
      process.exit(1)
    }

    console.log('🔍 Checking if admin user already exists...')
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email)
      console.log('📊 User details:', {
        id: existingAdmin.id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        createdAt: existingAdmin.createdAt
      })
      return
    }

    console.log('👤 Creating admin user...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📊 User details:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      createdAt: adminUser.createdAt
    })
    console.log('🔑 You can now login with:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedAdmin()
