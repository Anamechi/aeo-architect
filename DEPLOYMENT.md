# Cloudflare Pages Deployment Guide

## Build Configuration

### Build Settings
- **Build command**: `npm ci && npm run build`
- **Build output directory**: `dist`
- **Node version**: `18` (specified in `.nvmrc` and `.node-version`)

### Framework Preset
Select **Vite** as the framework preset in Cloudflare Pages dashboard.

## Environment Variables

Configure these environment variables in your Cloudflare Pages dashboard under:
**Settings → Environment Variables**

### Required Variables

```
VITE_SUPABASE_URL=https://hjbylbjbxjotbijzrwma.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnlsYmpieGpvdGJpanpyd21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzIxMTQsImV4cCI6MjA3NzQ0ODExNH0.Wr4LCkzteMzDgd-SUsFEoBtb3WHf--2kwMkYC66K56o
VITE_SUPABASE_PROJECT_ID=hjbylbjbxjotbijzrwma
```

### Environment Scopes
- Set these variables for **Production** environment
- Optionally set the same for **Preview** environment for testing

## Deployment Steps

1. **Connect Repository**
   - Link your Git repository to Cloudflare Pages
   - Select your main branch for production deployments

2. **Configure Build Settings**
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (leave blank)

3. **Add Environment Variables**
   - Navigate to Settings → Environment Variables
   - Add the three required variables listed above
   - Apply to Production (and Preview if needed)

4. **Deploy**
   - Save settings and trigger deployment
   - Cloudflare will automatically build and deploy your site

## Client-Side Routing

The `public/_redirects` file handles client-side routing for React Router:
- All non-asset requests are redirected to `index.html`
- This enables proper navigation and direct URL access

## Security Headers

The `public/_headers` file configures:
- Content Security Policy (CSP)
- XSS Protection
- Frame Options
- Content Type Options
- Referrer Policy

## Post-Deployment

After successful deployment:
1. Test all routes and functionality
2. Verify Supabase connection is working
3. Check admin authentication flows
4. Test form submissions and API calls

## Troubleshooting

### Build Failures
- Check that Node version 18 is being used
- Verify all environment variables are set correctly
- Review build logs for missing dependencies

### Runtime Issues
- Check browser console for environment variable errors
- Verify Supabase credentials are correct
- Ensure CORS is properly configured in Supabase dashboard

### Routing Issues
- Confirm `_redirects` file is in the `dist` folder after build
- Check that single-page app redirects are working
