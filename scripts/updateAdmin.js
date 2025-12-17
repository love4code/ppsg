require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../app/models/User')

const updateAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      console.error('Error: MONGODB_URI environment variable is not set')
      process.exit(1)
    }

    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    // Find existing admin user
    const existingUser = await User.findOne({ username: 'admin' })

    if (existingUser) {
      // Update existing admin user
      existingUser.username = 'theresa'
      existingUser.password = 'T&MPools2025'
      await existingUser.save()
      console.log('✅ Admin credentials updated successfully!')
      console.log('   Username: theresa')
      console.log('   Password: T&MPools2025')
    } else {
      // Check if theresa user already exists
      const theresaUser = await User.findOne({ username: 'theresa' })
      if (theresaUser) {
        // Update existing theresa user
        theresaUser.password = 'T&MPools2025'
        await theresaUser.save()
        console.log('✅ Admin credentials updated successfully!')
        console.log('   Username: theresa')
        console.log('   Password: T&MPools2025')
      } else {
        // Create new admin user
        const newAdmin = new User({
          username: 'theresa',
          password: 'T&MPools2025'
        })
        await newAdmin.save()
        console.log('✅ Admin user created successfully!')
        console.log('   Username: theresa')
        console.log('   Password: T&MPools2025')
      }
    }

    // Delete any other admin users to avoid confusion
    await User.deleteMany({ username: 'admin' })
    console.log('✅ Cleaned up old admin user')

    await mongoose.connection.close()
    console.log('✅ Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating admin credentials:', error)
    process.exit(1)
  }
}

updateAdmin()


