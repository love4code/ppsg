# PPSG CMS - Full-Stack Content Management System

A polished full-stack CMS built with Node.js, Express, MongoDB, and EJS templates.

## Features

- **Admin Panel**: Secure authentication and content management
- **Media Library**: Upload and manage images with automatic resizing
- **Content Management**: Manage Projects, Products, and Services
- **Contact Form**: Handle inquiries with email notifications
- **Responsive Design**: Modern Bootstrap 5 UI

## Installation

1. Clone the repository and navigate to the project directory:

```bash
cd PPSG
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

- `MONGODB_URI`: Your MongoDB connection string
- `PORT`: Server port (default: 3000)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: Email service configuration
- `EMAIL_TO`: Recipient email for contact form submissions
- `SESSION_SECRET`: A random secret string for session encryption

4. Seed the database with sample data (optional):

```bash
npm run seed
```

This will create:

- An admin user (username: `admin`, password: `admin123`)
- Sample media files
- Sample projects, products, and services

5. Start the development server:

```bash
npm run dev
```

Or for production:

```bash
npm start
```

6. Open your browser and navigate to:

- Public site: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`

## Admin Panel Usage

### Login

- Default credentials (after seeding): `admin` / `admin123`
- Change the password immediately after first login

### Managing Content

1. **Media Library** (`/admin/media`):

   - Upload multiple images at once
   - Images are automatically resized to small, medium, and large sizes
   - Search and filter media
   - Delete unwanted media

2. **Projects** (`/admin/projects`):

   - Create, edit, and delete projects
   - Set featured image and gallery
   - Control publish status

3. **Products** (`/admin/products`):

   - Manage product catalog
   - Set prices and tax status
   - Add product images

4. **Services** (`/admin/services`):

   - Manage service offerings
   - Set descriptions and pricing

5. **Contacts** (`/admin/contacts`):
   - View contact form submissions
   - Mark messages as read/unread

## Media Upload & Resizing

The system automatically processes uploaded images:

- **Small**: Thumbnail size (300px width) - used in grids and lists
- **Medium**: Standard size (800px width) - used in detail pages
- **Large**: Full size (1200px width) - used for hero images

All images are stored in MongoDB using GridFS for efficient storage and retrieval.

## Project Structure

```
PPSG/
├── app/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── views/           # EJS templates
│   └── public/          # Static assets
├── seeds/               # Database seed scripts
├── server.js            # Application entry point
└── package.json
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **EJS** - Template engine
- **Bootstrap 5** - CSS framework
- **Sharp** - Image processing
- **Nodemailer** - Email service
- **Multer** - File upload handling

## Security Notes

- Change default admin credentials in production
- Use strong `SESSION_SECRET` in production
- Keep `.env` file secure and never commit it
- Use environment variables for all sensitive data

## License

ISC
