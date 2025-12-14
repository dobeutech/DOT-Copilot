# Production Deployment Checklist

## Pre-Deployment

### Environment Variables
- [ ] Set `NODE_ENV=production`
- [ ] Configure `DATABASE_URL` with production PostgreSQL connection
- [ ] Set strong `JWT_SECRET` (32+ characters, random)
- [ ] Set strong `JWT_REFRESH_SECRET` (32+ characters, random)
- [ ] Configure `FRONTEND_URL` with production domain
- [ ] Set `API_BASE_URL` for frontend environment variable

### Database
- [ ] Create production PostgreSQL database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed initial data if needed: `npx prisma db seed`
- [ ] Set up database backups (automated daily)
- [ ] Configure connection pooling

### Security
- [ ] Review and update CORS settings
- [ ] Verify rate limiting is enabled
- [ ] Check Helmet.js security headers
- [ ] Review JWT token expiration times
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Review API authentication requirements

### Email Service
- [ ] Configure SMTP credentials:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `EMAIL_FROM`
- [ ] Test email delivery
- [ ] Verify email templates render correctly

### File Storage
- [ ] Create S3 bucket (or compatible storage)
- [ ] Configure AWS credentials:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_BUCKET`
- [ ] Set up bucket policies and CORS
- [ ] Test file upload/download

### Monitoring & Logging
- [ ] Configure Sentry DSN: `SENTRY_DSN`
- [ ] Set up log aggregation (CloudWatch, Datadog, etc.)
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring
- [ ] Configure alerting for errors

### CI/CD
- [ ] Configure GitHub Actions secrets
- [ ] Test deployment pipeline
- [ ] Set up staging environment
- [ ] Configure automatic deployments

## Deployment Steps

### Backend
1. Build Docker image: `docker build -t dot-copilot-backend ./backend`
2. Run database migrations
3. Deploy to hosting (Railway, Render, AWS, etc.)
4. Verify health endpoints: `/health`, `/health/ready`
5. Test API endpoints

### Frontend
1. Build production bundle: `npm run build`
2. Deploy to hosting (Vercel, Netlify, etc.)
3. Configure environment variables
4. Test all routes and authentication
5. Verify API connectivity

## Post-Deployment

### Testing
- [ ] Test user registration and login
- [ ] Test password reset flow
- [ ] Test all CRUD operations
- [ ] Test file uploads
- [ ] Test email notifications
- [ ] Test role-based access control
- [ ] Test quiz functionality
- [ ] Load testing (if applicable)

### Monitoring
- [ ] Monitor error rates in Sentry
- [ ] Check application logs
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Check disk space and memory usage

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document rollback procedure

## Rollback Plan

1. Keep previous deployment version available
2. Database migrations should be reversible
3. Have backup of environment variables
4. Document rollback steps for each service

## Performance Optimization

- [ ] Enable database query caching
- [ ] Configure CDN for static assets
- [ ] Optimize images and assets
- [ ] Enable compression (gzip/brotli)
- [ ] Set up database indexes
- [ ] Configure connection pooling

## Security Hardening

- [ ] Regular security updates
- [ ] Dependency vulnerability scanning
- [ ] Regular security audits
- [ ] Implement rate limiting per user
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular backup testing

## Maintenance

- [ ] Schedule regular database maintenance
- [ ] Monitor and clean up old logs
- [ ] Review and update dependencies
- [ ] Regular security patches
- [ ] Performance monitoring and optimization

