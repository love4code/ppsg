require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../app/models/User')

const createAdmin = async () => {
  try {
    // Get credentials from command line arguments or environment variables
    const username = process.argv[2] || process.env.ADMIN_USERNAME || 'admin'
    const password = process.argv[3] || process.env.ADMIN_PASSWORD

    if (!password) {
      console.error('❌ Error: Password is required')
      console.error('Usage: node scripts/createAdmin.js <username> <password>')
      console.error(
        '   or: ADMIN_USERNAME=user ADMIN_PASSWORD=pass node scripts/createAdmin.js'
      )
      process.exit(1)
    }

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI environment variable is not set')
      process.exit(1)
    }

    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Check if user already exists
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      // Update existing user
      existingUser.password = password
      await existingUser.save()
      console.log(`✅ Admin credentials updated successfully!`)
      console.log(`   Username: ${username}`)
      console.log(`   Password: ${password}`)
    } else {
      // Create new admin user
      const newAdmin = new User({
        username,
        password
      })
      await newAdmin.save()
      console.log(`✅ Admin user created successfully!`)
      console.log(`   Username: ${username}`)
      console.log(`   Password: ${password}`)
    }

    await mongoose.connection.close()
    console.log('✅ Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin credentials:', error)
    process.exit(1)
  }
}

createAdmin()


