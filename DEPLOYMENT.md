# Heroku Deployment Guide

## Prerequisites

1. Heroku account (sign up at [heroku.com](https://www.heroku.com))
2. Heroku CLI installed
3. Git repository initialized

## Initial Setup

1. **Login to Heroku:**

   ```bash
   heroku login
   ```

2. **Create Heroku app:**

   ```bash
   heroku create ppsg
   ```

   (Or use your existing app name)

3. **Add MongoDB Atlas (Recommended):**

   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string
   - Add it to Heroku config vars (see below)

   OR use Heroku MongoDB addon:

   ```bash
   heroku addons:create mongolab:sandbox
   ```

## Set Environment Variables

Set all required environment variables on Heroku:

```bash
# MongoDB Connection (use MongoDB Atlas connection string)
heroku config:set MONGODB_URI="your-mongodb-connection-string"

# Session Secret (generate a random string)
heroku config:set SESSION_SECRET="your-random-secret-key-here"

# Email Configuration
heroku config:set EMAIL_HOST="smtp.gmail.com"
heroku config:set EMAIL_PORT="587"
heroku config:set EMAIL_USER="your-email@gmail.com"
heroku config:set EMAIL_PASS="your-app-password"
heroku config:set EMAIL_TO="aquarianpoolandspa@gmail.com"

# Port (Heroku sets this automatically, but you can set it)
heroku config:set PORT="3000"
```

**Note:** For Gmail, you'll need to:

1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use that app password for `EMAIL_PASS`

## Deploy

1. **Make sure all files are committed:**

   ```bash
   git add .
   git commit -m "Prepare for Heroku deployment"
   ```

2. **Push to Heroku:**

   ```bash
   git push heroku main
   ```

   (Or `git push heroku master` if your default branch is master)

3. **Run seed script (optional, for initial data):**

   ```bash
   heroku run npm run seed
   ```

4. **Open your app:**
   ```bash
   heroku open
   ```

## Troubleshooting

### Push Rejected

- Make sure you have a `Procfile` in the root directory
- Check that `package.json` has a `start` script
- Verify Node.js version compatibility

### App Crashes

- Check logs: `heroku logs --tail`
- Verify all environment variables are set: `heroku config`
- Make sure MongoDB connection string is correct

### Database Issues

- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
- Check connection string format
- Ensure database user has proper permissions

### Email Not Working

- Verify Gmail app password is correct
- Check that 2FA is enabled on Gmail account
- Test email settings locally first

## Useful Commands

```bash
# View logs
heroku logs --tail

# Check config vars
heroku config

# Run commands on Heroku
heroku run npm run seed

# Open app
heroku open

# Restart app
heroku restart

# Scale dynos (if needed)
heroku ps:scale web=1
```

## Post-Deployment

1. **Change admin password** immediately after first login
2. **Test all functionality:**
   - Admin login
   - Media upload
   - Create/edit projects, products, services
   - Contact form submission
3. **Monitor logs** for any errors
4. **Set up custom domain** (optional) in Heroku dashboard
