# PriceCompare - Deployment Guide

This guide provides instructions for deploying the PriceCompare application to various hosting platforms.

## Prerequisites

- Node.js (v16 or higher)
- Python (3.8 or higher)
- PostgreSQL (or compatible database)
- Docker (optional, for containerized deployment)

## Environment Variables

### Backend (`.env` in root directory)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pricecompare

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS (update with your frontend URL in production)
FRONTEND_URL=http://localhost:3000

# Amazon Affiliate Settings (optional)
AMAZON_AFFILIATE_TAG=your-affiliate-tag

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900  # 15 minutes
```

### Frontend (`.env.production` in frontend directory)

```env
# API Configuration
VITE_API_BASE_URL=/api/v1
VITE_PUBLIC_PATH=/
VITE_ENVIRONMENT=production

# Analytics (optional)
# VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
# VITE_SENTRY_DSN=your-sentry-dsn
```

## Deployment Options

### 1. Docker Compose (Recommended)

1. Ensure Docker and Docker Compose are installed
2. Copy `docker-compose.prod.yml` to `docker-compose.yml`
3. Update environment variables in `.env` and `frontend/.env.production`
4. Build and start the services:
   ```bash
   docker-compose up --build -d
   ```
5. The application will be available at `http://localhost:80`

### 2. Heroku

#### Backend

1. Install Heroku CLI and login
2. Create a new Heroku app
3. Add PostgreSQL add-on
4. Set environment variables:
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set FRONTEND_URL=your-frontend-url
   # Add other required environment variables
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

#### Frontend

1. Create a new Heroku app with the static buildpack:
   ```bash
   heroku create your-app-name --buildpack https://github.com/heroku/heroku-buildpack-static.git
   ```
2. Set the build command and output directory:
   ```bash
   heroku config:set VITE_API_BASE_URL=your-backend-url/api/v1
   ```
3. Deploy:
   ```bash
   git subtree push --prefix frontend heroku main
   ```

### 3. AWS (Elastic Beanstalk + S3 + RDS)

#### Backend (Elastic Beanstalk + RDS)

1. Create an RDS PostgreSQL instance
2. Create an Elastic Beanstalk environment with the Python platform
3. Configure environment variables in the EB console
4. Deploy using the EB CLI:
   ```bash
   eb init -p python-3.8 pricecompare-backend
   eb deploy
   ```

#### Frontend (S3 + CloudFront)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Create an S3 bucket and enable static website hosting
3. Upload the contents of `dist` to the S3 bucket
4. Create a CloudFront distribution pointing to the S3 bucket
5. Set up a custom domain (optional)

### 4. DigitalOcean App Platform

1. Connect your GitHub/GitLab repository
2. Set up the backend service:
   - Runtime: Python
   - Build command: `pip install -r requirements.txt`
   - Run command: `uvicorn app.main:app --host 0.0.8 --port $PORT`
   - Add environment variables
3. Set up the frontend service:
   - Runtime: Static Site
   - Build command: `npm install && npm run build`
   - Output directory: `dist`
   - Add environment variables
4. Add a PostgreSQL database
5. Deploy the application

## Post-Deployment

1. Run database migrations:
   ```bash
   alembic upgrade head
   ```
2. Set up SSL certificates (recommended)
3. Configure monitoring and alerts
4. Set up automated backups for the database

## Monitoring and Maintenance

- Set up error tracking (e.g., Sentry)
- Configure logging and log rotation
- Set up automated database backups
- Monitor application performance and scale as needed

## Scaling

- **Vertical Scaling**: Increase server resources (CPU, RAM)
- **Horizontal Scaling**: Add more application instances behind a load balancer
- **Database Scaling**: Consider read replicas or sharding for high traffic

## Security Considerations

- Keep all dependencies updated
- Use HTTPS everywhere
- Implement proper CORS policies
- Regularly rotate secrets and API keys
- Set up rate limiting
- Implement proper authentication and authorization

## Troubleshooting

- Check application logs: `docker-compose logs -f`
- Verify database connectivity
- Check environment variables
- Test API endpoints directly
- Check frontend console for errors

## Support

For support, please open an issue in the repository or contact the development team.
