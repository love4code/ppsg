require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ppsg-cms';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('⚠️  Make sure MongoDB is running and the connection string is correct');
  console.error('⚠️  Connection string:', mongoUri);
  // Don't exit - let the app start but it will fail on database operations
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'app/public')));

// Trust proxy (required for Heroku)
app.set('trust proxy', 1);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/ppsg-cms',
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  res.locals.currentUser = req.session.user;
  delete req.session.success;
  delete req.session.error;
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app/views'));
app.use(require('express-ejs-layouts'));
app.set('layout', 'layouts/public'); // Default layout

// Routes
const publicRoutes = require('./app/routes/public');
const adminRoutes = require('./app/routes/admin');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== ERROR ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  
  // Disable layout for error pages
  res.locals.layout = false;
  
  // Try to render error page, but fallback to plain text if it fails
  try {
    res.status(500).render('errors/500', { error: err });
  } catch (renderError) {
    console.error('Failed to render error page:', renderError);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>500 - Server Error</title></head>
        <body>
          <h1>500 - Server Error</h1>
          <p>${process.env.NODE_ENV === 'production' ? 'An error occurred.' : err.message}</p>
          <a href="/">Go Home</a>
        </body>
      </html>
    `);
  }
});

// 404 handler
app.use((req, res) => {
  res.locals.layout = false; // Disable layout for error pages
  res.status(404).render('errors/404');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

