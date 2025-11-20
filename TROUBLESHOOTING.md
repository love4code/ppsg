# Troubleshooting Guide

## 500 Internal Server Error

If you're getting a 500 error, check the following:

### 1. Check Server Logs
Look at your terminal/console where the server is running. The error details will be printed there.

### 2. Common Issues

#### MongoDB Connection
- **Problem**: MongoDB is not running or connection string is incorrect
- **Solution**: 
  - Make sure MongoDB is running: `mongod` or check your MongoDB service
  - Verify your `MONGODB_URI` in `.env` file
  - Default connection: `mongodb://localhost:27017/ppsg-cms`

#### Missing Environment Variables
- **Problem**: Required environment variables are not set
- **Solution**: 
  - Copy `.env.example` to `.env`
  - Fill in all required values

#### Database Not Seeded
- **Problem**: Database is empty and queries are failing
- **Solution**: Run the seed script:
  ```bash
  npm run seed
  ```

#### Missing Dependencies
- **Problem**: Node modules not installed
- **Solution**: 
  ```bash
  npm install
  ```

### 3. Debug Steps

1. **Check if server starts:**
   ```bash
   npm run dev
   ```
   Look for any error messages in the console.

2. **Check MongoDB connection:**
   - You should see "✅ MongoDB connected successfully" in the console
   - If you see an error, fix the connection issue first

3. **Check the browser console:**
   - Open browser DevTools (F12)
   - Check the Network tab to see which request is failing
   - Check the Console tab for JavaScript errors

4. **Check server logs:**
   - The server will print detailed error information
   - Look for the error stack trace

### 4. Common Error Messages

#### "Cannot read property 'X' of null"
- Usually means a database query returned null
- Make sure you've seeded the database
- Check if the data exists in MongoDB

#### "Cast to ObjectId failed"
- Invalid MongoDB ObjectId format
- Usually happens when trying to access a resource that doesn't exist

#### "Layout render failed"
- Issue with express-ejs-layouts
- Make sure `express-ejs-layouts` is installed: `npm install express-ejs-layouts`

### 5. Quick Fixes

**Reset everything:**
```bash
# Stop the server (Ctrl+C)
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Make sure .env file exists
cp .env.example .env
# Edit .env with your settings

# Seed the database
npm run seed

# Start the server
npm run dev
```

### 6. Still Having Issues?

1. Check the exact error message in the server console
2. Verify MongoDB is running and accessible
3. Make sure all environment variables are set correctly
4. Try accessing the admin login page: `http://localhost:3000/admin/login`
5. Check if the database has data: Connect to MongoDB and check collections

