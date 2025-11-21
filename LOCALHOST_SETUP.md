# BizBloom - Localhost Setup Guide for FBLA

## Quick Start (5 Steps)

### Step 1: Install Node.js
Download and install from: https://nodejs.org/ (LTS version)

### Step 2: Install Dependencies
Open terminal/PowerShell in the project folder:
```bash
npm install --legacy-peer-deps
```

### Step 3: Get a Free Database
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Provision MySQL"
4. Click MySQL → "Connect" → Copy the connection URL

### Step 4: Create Environment File
Create a file named `.env` in the root directory with this content:

```
DATABASE_URL="paste-your-railway-url-here"
JWT_SECRET="bizbloom-secret-key-2024-fbla-project-secure-token"
VITE_APP_TITLE="BizBloom"
VITE_APP_LOGO="/logo.svg"
```

### Step 5: Setup Database and Run
```bash
npm run db:push
npx tsx server/seed-gamification.ts
npm run dev
```

Open browser to: http://localhost:3000

## For FBLA Demo Day

1. Open your laptop
2. Run `npm run dev` in the project folder
3. Open browser to http://localhost:3000
4. Demo the app!

## Troubleshooting

**"pnpm: command not found"**
- Use `npm` instead of `pnpm` for all commands

**"DATABASE_URL not set"**
- Make sure you created the `.env` file in the root directory
- Check that Railway database URL is correct

**"Module not found" errors**
- Delete `node_modules` folder
- Run `npm install --legacy-peer-deps` again

## What Works Without Login

Since OAuth only works on Manus platform, these features work without login:
- ✅ Search businesses
- ✅ View business details
- ✅ Browse deals
- ✅ View trending businesses

These require login (won't work on localhost):
- ❌ Add favorites
- ❌ Write reviews
- ❌ View badges/challenges

**For demo purposes**, you can explain to judges that authentication is implemented
but requires the OAuth server which isn't available locally.
