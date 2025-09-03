# EIMS Demo - Render Deployment Guide

This guide will help you deploy your EIMS Demo application to Render.

## Project Structure
- **Frontend**: React/Vite application in `client/` directory
- **Backend**: Express.js server in `server/` directory
- **Shared**: Common types/utilities in `shared/` directory

## Deployment Options

### Option 1: Single Web Service (Recommended for development)
Deploy both frontend and backend as a single service where the Express server serves the built React app.

### Option 2: Separate Services
Deploy frontend as a static site and backend as a separate web service.

## Quick Deploy to Render

### Option 1: Single Service Deployment

1. **Connect your GitHub repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub account and select the `eims-demo` repository

2. **Configure the service:**
   - **Name**: `eims-demo`
   - **Environment**: `Node`
   - **Plan**: `Free` (or choose paid plan for production)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Environment Variables:**
   Add these in the Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   ```
   
   Add any additional environment variables your app needs:
   ```
   DATABASE_URL=your_database_url
   SESSION_SECRET=your_session_secret
   SENDGRID_API_KEY=your_sendgrid_key
   ```

4. **Deploy**: Click "Create Web Service"

### Option 2: Separate Services (Frontend + Backend)

#### Backend Service:
1. Create a new Web Service
2. Configure:
   - **Name**: `eims-demo-api`
   - **Root Directory**: `/` (or leave empty)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### Frontend Service:
1. Create a new Static Site
2. Configure:
   - **Name**: `eims-demo-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

## Database Setup (if needed)

If your app uses a database, you can add a PostgreSQL database:

1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure and create the database
4. Add the connection string to your web service environment variables

## Custom Domain (Optional)

1. In your service settings, go to "Custom Domains"
2. Add your domain
3. Configure your DNS to point to Render's servers

## Environment Variables

Make sure to set these environment variables in your Render service:

```bash
NODE_ENV=production
PORT=10000
# Add your specific environment variables here
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
SENDGRID_API_KEY=your-api-key
```

## Build Configuration

The build process is configured in `package.json`:

- **Development**: `npm run dev`
- **Build**: `npm run build` (builds both frontend and backend)
- **Production**: `npm start` (starts the production server)

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation succeeds
   - Verify environment variables are set correctly

2. **Runtime Errors**
   - Check the Render logs for detailed error messages
   - Ensure database connections are configured correctly
   - Verify all required environment variables are set

3. **Static File Issues**
   - Make sure the build output directory is correct
   - Check that the Express server is configured to serve static files

### Logs
Access logs in the Render dashboard under your service → "Logs" tab.

## Monitoring

Render provides:
- Automatic health checks
- Performance metrics
- Log aggregation
- Automatic deployments on git push

## Scaling

- **Free Plan**: Limited resources, good for development
- **Paid Plans**: More resources, custom domains, priority support

For production use, consider upgrading to a paid plan for better performance and reliability.
