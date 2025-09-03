# EIMS Deployment Guide

## Quick Deployment Options

### 1. Vercel (Recommended - Easy & Fast)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configuration for Vercel:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 2. Railway (Full-stack with Database)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway deploy
```

### 3. Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### 4. Heroku

```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

## Environment Variables for Production

Set these in your deployment platform:

```env
DATABASE_URL=your_production_database_url
SESSION_SECRET=your_super_secret_session_key
NODE_ENV=production
PORT=5000
```

## Database Setup for Production

### Option 1: Neon (Recommended)
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Set as DATABASE_URL in your environment

### Option 2: Railway PostgreSQL
1. Add PostgreSQL service in Railway
2. Use the provided DATABASE_URL

### Option 3: Supabase
1. Create project at https://supabase.com
2. Go to Settings > Database
3. Copy connection string

## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] .env file added to .gitignore
- [ ] Build process tested locally
- [ ] All dependencies in package.json
- [ ] Static assets properly configured

## Post-deployment Steps

1. **Verify Application**:
   - Visit deployed URL
   - Test login with demo users
   - Check database connection

2. **Monitor Performance**:
   - Check application logs
   - Monitor response times
   - Verify WebSocket connections

3. **Security Review**:
   - Ensure HTTPS is enabled
   - Verify environment variables are secure
   - Check CORS settings

## Common Issues & Solutions

### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues
- Verify DATABASE_URL format
- Check firewall settings
- Ensure SSL is enabled for production

### Static Asset Issues
- Verify build output directory
- Check asset paths in production
- Ensure proper MIME types

## Monitoring & Maintenance

### Recommended Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Performance**: New Relic, DataDog
- **Analytics**: Google Analytics

### Regular Maintenance
- Update dependencies monthly
- Monitor database performance
- Check application logs weekly
- Backup database regularly

## Scaling Considerations

### Database Optimization
- Add database indexes for frequently queried fields
- Implement connection pooling
- Consider read replicas for high traffic

### Application Scaling
- Use load balancers for multiple instances
- Implement caching (Redis)
- Consider CDN for static assets
- Monitor memory usage and CPU

### Security Enhancements
- Implement rate limiting
- Add API authentication tokens
- Use HTTPS everywhere
- Regular security audits

---

For detailed deployment instructions for specific platforms, refer to their official documentation.
