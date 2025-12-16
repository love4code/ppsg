# Database Debugging Guide

## What Was Added

I've added comprehensive database connection monitoring and error logging to help diagnose why your live site isn't showing data from the database.

### 1. Database Connection Check Middleware (`app/middleware/dbCheck.js`)

- Logs warnings when database is not connected
- Provides `ensureDatabaseConnected()` helper to check connection before queries
- Shows connection state in production logs

### 2. Improved Error Logging

- All public controllers now log detailed error information
- Shows database connection state when errors occur
- Logs warnings when no data is found (helpful for debugging)

### 3. Enhanced Server Logging

- Server now logs masked connection string in production
- Shows database name and connection state on successful connection
- Better error messages with error codes

### 4. Diagnostic Endpoint

- Access `/admin/diagnostics` (requires login) to see:
  - Database connection state
  - Connection details (masked for security)
  - Count of products, projects, services (total and published)
  - Any errors encountered

## How to Debug Your Live Site

### Step 1: Check Heroku Logs

```bash
heroku logs --tail
```

Look for:

- `✅ MongoDB connected successfully` - Good!
- `❌ MongoDB connection error` - Problem!
- `⚠️ Database connection state: disconnected` - Problem!

### Step 2: Check Environment Variables

```bash
heroku config
```

Verify:

- `MONGODB_URI` is set and correct
- Connection string format is correct (should start with `mongodb://` or `mongodb+srv://`)

### Step 3: Use Diagnostic Endpoint

1. Log into your admin panel
2. Visit: `https://your-site.com/admin/diagnostics`
3. Check the JSON response for:
   - `database.connectionStateName` should be `"connected"`
   - `data.products.published` should be > 0 if you have published products
   - `data.projects.published` should be > 0 if you have published projects
   - `data.services.published` should be > 0 if you have published services

### Step 4: Common Issues and Solutions

#### Issue: Database Not Connected

**Symptoms:**

- Logs show `connectionState: 0` (disconnected)
- Diagnostic endpoint shows `connectionStateName: "disconnected"`

**Solutions:**

1. Check `MONGODB_URI` in Heroku config vars
2. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
3. Check MongoDB Atlas cluster is running
4. Verify connection string format is correct

#### Issue: Database Connected But No Data

**Symptoms:**

- Connection state is `connected` (1)
- But `published` counts are 0

**Solutions:**

1. Check if items have `status: 'published'` in database
2. Run seed script: `heroku run npm run seed`
3. Verify data exists in MongoDB Atlas

#### Issue: Connection String Wrong

**Symptoms:**

- Connection errors in logs
- Error mentions authentication or network

**Solutions:**

1. Regenerate MongoDB Atlas connection string
2. Make sure password is URL-encoded (special characters)
3. Verify database user has read/write permissions
4. Check connection string includes database name

### Step 5: Test Database Connection Locally

If you have the same connection string locally:

```bash
# Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(e => console.error(e))"
```

## What the Logs Will Show

### Good Connection:

```
🔌 Attempting MongoDB connection...
✅ MongoDB connected successfully
✅ Database name: your-database-name
✅ Connection state: connected
```

### Bad Connection:

```
🔌 Attempting MongoDB connection...
❌ MongoDB connection error: [error message]
❌ Error code: [error code]
⚠️  Connection string (masked): mongodb+srv://***:***@...
```

### When Loading Pages:

```
⚠️  Home page: No published content found in database
⚠️  Check if database is seeded and items have status: "published"
```

Or if database is disconnected:

```
⚠️  Database connection state: disconnected (0)
⚠️  Request path: /
❌ Home page error: Database is not connected
❌ Error code: DB_NOT_CONNECTED
❌ Database state: disconnected (0)
```

## Next Steps

1. **Deploy these changes** to your live site
2. **Check Heroku logs** after deployment
3. **Visit diagnostic endpoint** to see current state
4. **Fix any issues** found in diagnostics
5. **Verify data exists** in MongoDB Atlas dashboard

## Quick Fixes

### If Database Not Connected:

```bash
# Check config
heroku config:get MONGODB_URI

# Set correct connection string
heroku config:set MONGODB_URI="your-connection-string-here"

# Restart app
heroku restart
```

### If No Data:

```bash
# Seed database
heroku run npm run seed

# Or manually add data through admin panel
```

### If Connection String Issues:

1. Go to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy connection string
5. Replace `<password>` with your actual password (URL-encoded)
6. Update Heroku config var
