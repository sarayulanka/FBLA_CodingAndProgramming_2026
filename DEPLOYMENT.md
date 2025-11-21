# BizBloom Deployment Instructions

## Overview
BizBloom is now configured with the Yelp API key embedded directly in the code, making deployment simpler without needing to configure environment variables.

## Current Deployment Status

### ✅ Manus Platform (Recommended - Easiest)
The website is already deployed and working on Manus:
- **Live URL**: Check your Manus dashboard for the published URL
- **Status**: Fully functional with embedded API key
- **Action Required**: None - just click "Publish" in the Manus UI if you haven't already

### 📦 Downloadable ZIP File
A complete ZIP file is available at: `/home/ubuntu/bizbloom-with-api-key.zip`
- Contains all source code with embedded API key
- Ready to run locally or deploy to other platforms
- Excludes `node_modules` (will be installed during setup)

## Local Development Setup

1. **Extract the ZIP file**
   ```bash
   unzip bizbloom-with-api-key.zip
   cd byte-sized-business-boost
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up database**
   - The project uses MySQL/TiDB by default
   - Update `DATABASE_URL` in `.env` file with your database connection string
   - Run migrations:
     ```bash
     pnpm db:push
     ```

4. **Configure OAuth (Required for login)**
   - Set up OAuth credentials in `.env`:
     ```
     JWT_SECRET=your-secret-key
     OAUTH_SERVER_URL=your-oauth-server
     VITE_OAUTH_PORTAL_URL=your-oauth-portal
     VITE_APP_ID=your-app-id
     ```
   - Or use Manus OAuth (already configured in Manus deployment)

5. **Run the development server**
   ```bash
   pnpm dev
   ```
   - Server runs on `http://localhost:3000`

## Alternative Deployment Options

### Option 1: Continue with Manus (Recommended)
**Pros:**
- Already working with embedded API key
- No additional configuration needed
- Free hosting included
- Database and OAuth pre-configured

**Steps:**
1. Open your Manus dashboard
2. Click "Publish" button
3. Your site is live!

### Option 2: Deploy to Render.com
**Note:** Requires PostgreSQL conversion (currently using MySQL)

**Steps:**
1. Convert database from MySQL to PostgreSQL:
   - Update `drizzle.config.ts` dialect to `postgresql`
   - Update `server/db.ts` imports
   - Add `postgres` package: `pnpm add postgres`

2. Create a new Web Service on Render:
   - Connect your GitHub repository
   - Build command: `pnpm install && pnpm build`
   - Start command: `pnpm start`

3. Add PostgreSQL database:
   - Create new PostgreSQL database in Render
   - Copy connection string to `DATABASE_URL` environment variable

4. Configure environment variables in Render:
   - `DATABASE_URL` (from Render PostgreSQL)
   - `JWT_SECRET` (generate a random string)
   - OAuth variables (if using custom OAuth)

### Option 3: Deploy to Vercel/Netlify
These platforms work well for static sites but require additional configuration for the backend API.

## Important Notes

### API Key Security
- The Yelp API key is currently embedded in `server/yelp.ts`
- This is convenient for quick deployment but not ideal for production
- For production, consider:
  - Moving the API key to environment variables
  - Using a secrets manager
  - Implementing rate limiting

### Database
- Manus deployment uses TiDB (MySQL-compatible)
- Local development requires MySQL or TiDB
- Render deployment requires PostgreSQL conversion

### Authentication
- Manus deployment has OAuth pre-configured
- Other deployments require OAuth setup or alternative auth method

## Troubleshooting

### "Yelp API key not configured" error
- This should NOT appear with the embedded key
- If you see this, check that `server/yelp.ts` contains the fallback key

### Database connection errors
- Verify `DATABASE_URL` is correctly set
- Ensure database is accessible from your deployment platform
- Check that migrations have been run (`pnpm db:push`)

### OAuth/Login issues
- Verify OAuth environment variables are set
- Check that callback URLs are configured correctly
- Ensure JWT_SECRET is set

## Support
For issues or questions about the Manus platform, visit: https://help.manus.im

## Next Steps
1. Choose your deployment platform
2. Follow the relevant steps above
3. Test all features after deployment
4. Consider moving API key to environment variables for production
