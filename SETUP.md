# Tempest Table - Setup Guide

Complete setup instructions for running the Tempest Virtual Tabletop application.

## Prerequisites

- **Node.js** 18+ (recommend 20 LTS)
- **npm** 9+ (comes with Node.js)
- A **Supabase** account (free tier is sufficient)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `tempest-table` (or any name you prefer)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the closest to your players
4. Click **"Create new project"** and wait for it to initialize (~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Set Up the Database

### 3a. Run the Schema Migration

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql` and paste it
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned" - this is normal

### 3b. Create Storage Buckets

The storage SQL may not work directly. It's easier to create buckets via the dashboard:

1. Go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Create a bucket named `maps`:
   - Name: `maps`
   - Public bucket: **Yes** (toggle on)
   - Click "Create bucket"
4. Create another bucket named `tokens`:
   - Name: `tokens`
   - Public bucket: **Yes** (toggle on)
   - Click "Create bucket"

### 3c. Set Storage Policies (Important!)

For each bucket (`maps` and `tokens`), you need to add policies:

1. Click on the bucket name
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"For full customization"**
5. Add these policies for EACH bucket:

**SELECT Policy (Read):**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: Leave empty (applies to all)
- USING expression: `true`

**INSERT Policy (Upload):**
- Policy name: `Allow uploads`
- Allowed operation: `INSERT`
- Target roles: Leave empty
- WITH CHECK expression: `true`

**UPDATE Policy:**
- Policy name: `Allow updates`
- Allowed operation: `UPDATE`
- Target roles: Leave empty
- USING expression: `true`

**DELETE Policy:**
- Policy name: `Allow deletes`
- Allowed operation: `DELETE`
- Target roles: Leave empty
- USING expression: `true`

## Step 4: Configure the Application

1. In the project root, copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 5: Install Dependencies and Run

```bash
# Install all dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Step 6: Test the Application

1. Open `http://localhost:5173` in your browser
2. Click **"Create Session"**
3. Enter a session name (e.g., "Test Session") and your username
4. You should be taken to the session lobby
5. Note the session code (e.g., "ABCD-1234") - share this with players

### Testing with Multiple Users

Open the app in an incognito/private window or different browser to simulate another player joining with the session code.

## Deployment to Cloudflare Pages

### Build for Production

```bash
npm run build
```

This creates a `dist` folder with the production build.

### Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click **"Create a project"** → **"Connect to Git"**
3. Select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
6. Click **"Save and Deploy"**

Your app will be available at `https://your-project.pages.dev`

## Troubleshooting

### "Failed to fetch" errors
- Check that your Supabase URL and anon key are correct in `.env.local`
- Ensure the Supabase project is active (free tier pauses after 1 week of inactivity)

### Storage upload errors
- Verify storage buckets exist and are public
- Check that all 4 policies (SELECT, INSERT, UPDATE, DELETE) are added to each bucket

### Real-time not working
- Go to Supabase → Database → Replication
- Ensure all tables are listed under "supabase_realtime" publication
- If not, run this SQL:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
  ALTER PUBLICATION supabase_realtime ADD TABLE maps;
  ALTER PUBLICATION supabase_realtime ADD TABLE characters;
  ALTER PUBLICATION supabase_realtime ADD TABLE session_players;
  ALTER PUBLICATION supabase_realtime ADD TABLE npc_templates;
  ALTER PUBLICATION supabase_realtime ADD TABLE npc_instances;
  ALTER PUBLICATION supabase_realtime ADD TABLE dice_rolls;
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  ```

### Database errors
- Check the Supabase SQL editor for any failed migrations
- Look at the Supabase logs (Database → Logs)

## File Size Limits

- **Map images**: Max 25MB, 5000x5000 pixels
- **Token images**: Max 500KB

## Free Tier Limits (Supabase)

- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB/month
- Realtime: 200 concurrent connections

These limits are more than sufficient for personal use with a small group.

## Getting Help

If you encounter issues:
1. Check the browser console (F12 → Console) for error messages
2. Check Supabase logs (Database → Logs)
3. Verify all environment variables are set correctly
