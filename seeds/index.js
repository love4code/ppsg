require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../app/models/User')
const Media = require('../app/models/Media')
const Project = require('../app/models/Project')
const Product = require('../app/models/Product')
const Service = require('../app/models/Service')
const sharp = require('sharp')

// Create a simple placeholder image buffer
const createPlaceholderImage = async (width, height) => {
  const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#e0e0e0"/>
            <text x="50%" y="50%" font-family="Arial" font-size="20" fill="#999" text-anchor="middle" dominant-baseline="middle">
                ${width}x${height}
            </text>
        </svg>
    `
  return await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 85 })
    .toBuffer()
}

const seed = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/ppsg-cms'
    )
    console.log('Connected to MongoDB')

    // Clear existing data
    console.log('Clearing existing data...')
    await User.deleteMany({})
    await Media.deleteMany({})
    await Project.deleteMany({})
    await Product.deleteMany({})
    await Service.deleteMany({})

    // Create admin user
    console.log('Creating admin user...')
    const admin = new User({
      username: 'admin',
      password: 'admin123'
    })
    await admin.save()
    console.log('Admin user created: username=admin, password=admin123')

    // Create sample media
    console.log('Creating sample media...')
    const mediaFiles = [
      { name: 'pool-1.jpg', title: 'Swimming Pool 1' },
      { name: 'pool-2.jpg', title: 'Swimming Pool 2' },
      { name: 'pool-3.jpg', title: 'Swimming Pool 3' },
      { name: 'spa-1.jpg', title: 'Spa Installation 1' },
      { name: 'spa-2.jpg', title: 'Spa Installation 2' },
      { name: 'renovation-1.jpg', title: 'Pool Renovation 1' },
      { name: 'product-1.jpg', title: 'Pool Equipment 1' },
      { name: 'product-2.jpg', title: 'Pool Equipment 2' },
      { name: 'service-1.jpg', title: 'Maintenance Service' }
    ]

    const createdMedia = []
    for (const file of mediaFiles) {
      const originalBuffer = await createPlaceholderImage(1920, 1080)

      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(300, null, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toBuffer()

      const mediumBuffer = await sharp(originalBuffer)
        .resize(800, null, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toBuffer()

      const largeBuffer = await sharp(originalBuffer)
        .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: 90, progressive: true, mozjpeg: true })
        .toBuffer()

      const thumbnailMeta = await sharp(thumbnailBuffer).metadata()
      const mediumMeta = await sharp(mediumBuffer).metadata()
      const largeMeta = await sharp(largeBuffer).metadata()

      const media = new Media({
        originalFilename: file.name,
        title: file.title,
        altText: file.title,
        mimeType: 'image/jpeg',
        sizes: {
          thumbnail: {
            data: thumbnailBuffer,
            width: thumbnailMeta.width,
            height: thumbnailMeta.height
          },
          medium: {
            data: mediumBuffer,
            width: mediumMeta.width,
            height: mediumMeta.height
          },
          large: {
            data: largeBuffer,
            width: largeMeta.width,
            height: largeMeta.height
          }
        }
      })

      await media.save()
      createdMedia.push(media)
      console.log(`Created media: ${file.name}`)
    }

    // Helper function to generate slug
    const generateSlug = text => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Create sample projects
    console.log('Creating sample projects...')
    const projects = [
      {
        title: 'Luxury Pool Installation',
        slug: generateSlug('Luxury Pool Installation'),
        description:
          'A beautiful luxury pool installation featuring modern design and premium materials. This project showcases our commitment to excellence and attention to detail.',
        mainImage: createdMedia[0]._id,
        gallery: [createdMedia[1]._id, createdMedia[2]._id],
        status: 'published',
        location: 'Los Angeles, CA',
        date: new Date('2024-01-15'),
        tags: ['pool', 'installation', 'luxury']
      },
      {
        title: 'Spa Renovation Project',
        slug: generateSlug('Spa Renovation Project'),
        description:
          'Complete renovation of an existing spa area, including new equipment installation and modern design updates.',
        mainImage: createdMedia[3]._id,
        gallery: [createdMedia[4]._id],
        status: 'published',
        location: 'San Diego, CA',
        date: new Date('2024-02-20'),
        tags: ['spa', 'renovation']
      },
      {
        title: 'Pool Deck Renovation',
        slug: generateSlug('Pool Deck Renovation'),
        description:
          'Transformation of an outdated pool deck into a modern, functional space with new materials and improved layout.',
        mainImage: createdMedia[5]._id,
        status: 'published',
        location: 'Orange County, CA',
        date: new Date('2024-03-10'),
        tags: ['renovation', 'deck']
      }
    ]

    for (const projectData of projects) {
      const project = new Project(projectData)
      await project.save()
      console.log(`Created project: ${project.title}`)
    }

    // Create sample products
    console.log('Creating sample products...')
    const products = [
      {
        name: 'Premium Pool Filter System',
        slug: generateSlug('Premium Pool Filter System'),
        description:
          'High-quality pool filter system designed for maximum efficiency and durability. Features advanced filtration technology.',
        price: 1299.99,
        isTaxable: true,
        mainImage: createdMedia[6]._id,
        status: 'published'
      },
      {
        name: 'Pool Cleaning Kit',
        slug: generateSlug('Pool Cleaning Kit'),
        description:
          'Complete pool cleaning kit with all essential tools for maintaining a clean and healthy pool.',
        price: 89.99,
        isTaxable: true,
        mainImage: createdMedia[7]._id,
        status: 'published'
      }
    ]

    for (const productData of products) {
      const product = new Product(productData)
      await product.save()
      console.log(`Created product: ${product.name}`)
    }

    // Create sample services
    console.log('Creating sample services...')
    const services = [
      {
        name: 'Pool Installation',
        slug: generateSlug('Pool Installation'),
        description:
          'Professional pool installation service. We handle everything from design to completion, ensuring your new pool meets all your needs and exceeds your expectations.',
        basePrice: 50000.0,
        mainImage: createdMedia[0]._id,
        status: 'published'
      },
      {
        name: 'Pool Maintenance',
        slug: generateSlug('Pool Maintenance'),
        description:
          'Regular pool maintenance service to keep your pool clean, safe, and in perfect condition year-round.',
        basePrice: 150.0,
        mainImage: createdMedia[8]._id,
        status: 'published'
      },
      {
        name: 'Pool Repair',
        slug: generateSlug('Pool Repair'),
        description:
          'Expert pool repair services for all types of issues. Fast, reliable, and affordable solutions.',
        mainImage: createdMedia[5]._id,
        status: 'published'
      }
    ]

    for (const serviceData of services) {
      const service = new Service(serviceData)
      await service.save()
      console.log(`Created service: ${service.name}`)
    }

    console.log('\n✅ Seeding completed successfully!')
    console.log('\nAdmin credentials:')
    console.log('  Username: admin')
    console.log('  Password: admin123')
    console.log('\n⚠️  Please change the admin password after first login!')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seed()
