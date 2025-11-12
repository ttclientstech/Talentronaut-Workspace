# Deployment Guide

This guide covers deploying the AI powered Work Manager to production environments.

## Pre-Deployment Checklist

### Required Environment Variables
Ensure all required variables are set in your production environment:

- ✅ `MONGODB_URI` - Production MongoDB connection string
- ✅ `JWT_SECRET` - Secure random secret (min 32 characters)
- ✅ `GEMINI_API_KEY` - Google Gemini API key
- ✅ `NODE_ENV=production`
- ✅ `NEXT_PUBLIC_API_URL` - Your production URL

### Security Checklist
- ✅ JWT_SECRET is strong and randomly generated
- ✅ MongoDB connection uses authentication
- ✅ HTTPS is enabled
- ✅ CORS is properly configured
- ✅ No sensitive data in client-side code
- ✅ Environment variables are not committed to git

### Code Quality Checklist
- ✅ All TypeScript errors resolved: `pnpm build`
- ✅ No console.log statements in production code
- ✅ Error handling is implemented
- ✅ API rate limiting considered
- ✅ Database indexes are optimized

## Deployment Platforms

### Vercel (Recommended)

Vercel provides the best integration with Next.js applications.

#### Prerequisites
- Vercel account (free tier available)
- GitHub account
- MongoDB Atlas instance

#### Steps

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "chore: prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Environment Variables**
   In Vercel project settings, add:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<your-secure-secret>
   GEMINI_API_KEY=<your-api-key>
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployment URL

#### Automatic Deployments
- Push to `main` branch → Production deployment
- Push to `develop` branch → Preview deployment
- Pull requests → Preview deployments

### Railway

Railway provides easy deployment with built-in MongoDB.

#### Steps

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add MongoDB**
   - Click "New Service"
   - Select "MongoDB"
   - Railway provides `MONGO_URL` automatically

4. **Set Environment Variables**
   ```
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   JWT_SECRET=<generate-secure-secret>
   GEMINI_API_KEY=<your-api-key>
   NODE_ENV=production
   ```

5. **Deploy**
   - Railway automatically builds and deploys
   - Get your deployment URL from settings

### Netlify

Netlify is another excellent option for Next.js apps.

#### Steps

1. **Connect Repository**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select repository

2. **Build Settings**
   ```
   Build command: pnpm build
   Publish directory: .next
   ```

3. **Environment Variables**
   Add in Site settings → Build & deploy → Environment:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<secure-secret>
   GEMINI_API_KEY=<your-api-key>
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-site.netlify.app
   ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify builds and deploys automatically

### AWS (Advanced)

For more control, deploy to AWS using EC2 or Elastic Beanstalk.

#### EC2 Deployment

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.medium or larger
   - Configure security groups (port 80, 443, 22)

2. **Install Dependencies**
   ```bash
   # SSH into instance
   ssh -i your-key.pem ubuntu@your-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install pnpm
   npm install -g pnpm

   # Install PM2 for process management
   npm install -g pm2
   ```

3. **Clone and Build**
   ```bash
   git clone <your-repo>
   cd "AI powered Work Manager"
   pnpm install
   pnpm build
   ```

4. **Set Environment Variables**
   ```bash
   nano .env.local
   # Add all production variables
   ```

5. **Start with PM2**
   ```bash
   pm2 start npm --name "work-management" -- start
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Set Up SSL with Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## MongoDB Setup for Production

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free tier cluster (M0)
   - Select region closest to your app

2. **Configure Security**
   - Database Access: Create database user
   - Network Access: Add IP whitelist
     - For production: Add your server IP
     - For Vercel: Add `0.0.0.0/0` (Vercel uses dynamic IPs)

3. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` and `<dbname>`

4. **Connection String Format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/work-management?retryWrites=true&w=majority
   ```

### Self-Hosted MongoDB

If running MongoDB on your own server:

1. **Enable Authentication**
   ```bash
   mongosh
   use admin
   db.createUser({
     user: "admin",
     pwd: "secure-password",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
   })
   ```

2. **Configure mongod.conf**
   ```yaml
   security:
     authorization: enabled
   net:
     bindIp: 0.0.0.0
   ```

3. **Restart MongoDB**
   ```bash
   sudo systemctl restart mongod
   ```

4. **Connection String**
   ```
   mongodb://admin:password@your-server:27017/work-management?authSource=admin
   ```

## Post-Deployment

### Verification Steps

1. **Test Application**
   - Visit your deployment URL
   - Sign up for new account
   - Create organization
   - Test all major features

2. **Check Logs**
   ```bash
   # Vercel
   vercel logs

   # Railway
   Check Railway dashboard

   # PM2 on EC2
   pm2 logs work-management
   ```

3. **Monitor Performance**
   - Check response times
   - Monitor error rates
   - Watch MongoDB metrics

### Database Backup

#### MongoDB Atlas
- Automated backups included in paid tiers
- Configure backup schedule in Atlas dashboard

#### Self-Hosted
```bash
# Daily backup script
mongodump --uri="mongodb://user:pass@localhost:27017/work-management" --out=/backups/$(date +%Y%m%d)

# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Monitoring

### Application Monitoring
- Vercel Analytics (included)
- New Relic
- DataDog
- Sentry for error tracking

### Database Monitoring
- MongoDB Atlas built-in monitoring
- Database response times
- Connection pool usage
- Query performance

## Scaling

### Horizontal Scaling
- Vercel automatically scales
- Railway supports multiple instances
- AWS: Use load balancer with multiple EC2 instances

### Database Scaling
- MongoDB Atlas: Upgrade cluster tier
- Add read replicas for read-heavy workloads
- Implement caching layer (Redis)

### CDN
- Vercel includes edge network
- CloudFlare for additional caching
- Serve static assets from CDN

## Troubleshooting

### Build Fails
```bash
# Check build logs
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Dependency issues
```

### Application Won't Start
```bash
# Check:
# - All environment variables set
# - MongoDB connection string correct
# - Port not already in use
# - Logs for specific errors
```

### Database Connection Issues
```bash
# Verify:
# - MongoDB is running
# - Connection string is correct
# - IP is whitelisted (Atlas)
# - Credentials are correct
# - Network allows outbound MongoDB port (27017)
```

### Performance Issues
```bash
# Investigate:
# - Slow database queries (add indexes)
# - Memory usage (increase server size)
# - Network latency (move DB closer)
# - Too many concurrent connections
```

## Security Best Practices

### Application Security
- ✅ Keep dependencies updated
- ✅ Use environment variables for secrets
- ✅ Implement rate limiting
- ✅ Enable CORS properly
- ✅ Validate all user input
- ✅ Use HTTPS only

### Database Security
- ✅ Enable authentication
- ✅ Use strong passwords
- ✅ Limit IP access
- ✅ Regular backups
- ✅ Encrypt connections (SSL/TLS)
- ✅ Monitor access logs

### Monitoring Security
- ✅ Set up alerts for:
  - Failed login attempts
  - Database errors
  - Unusual traffic patterns
  - API rate limit hits

## Rollback Procedure

### Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Git-based Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Database Rollback
```bash
# Restore from backup
mongorestore --uri="mongodb://..." --drop /backups/20240101
```

## Support

For deployment issues:
1. Check application logs
2. Review this deployment guide
3. Consult platform documentation
4. Create an issue in the repository

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
