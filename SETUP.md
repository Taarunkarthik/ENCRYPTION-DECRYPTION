# 🚀 Setup & Deployment Guide

Complete step-by-step guide for setting up and deploying the File Encryption & Decryption Web App.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- **Git** - Version control
- **Docker & Docker Compose** - Containerization (for Docker setup)
- **Java 17+** - Backend runtime (for local dev)
- **Maven 3.9+** - Build tool (for local backend)
- **Node.js 20+** - Frontend runtime (for local dev)
- **npm** - Package manager

### Check Versions
```bash
git --version
java -version
mvn -v
node --version
npm --version
docker --version
docker-compose --version
```

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - **Project Name**: encryption-app (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to you
5. Click "Create new project" (wait ~2-3 minutes)

### Step 2: Set Up Database Tables

1. In Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Copy the entire content of `sql/init.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Verify tables created: `audit_logs` table should appear in sidebar

### Step 3: Get Credentials

1. Go to **Settings → API** in Supabase
2. Note down:
   - **Project URL** (e.g., https://xxx.supabase.co)
   - **Anon Key** (public, used by frontend)
   - **Service Role Key** (secret, used by backend)
   - **JWT Secret** (Settings → API → JWT Secret)

3. Create `.env` file in project root:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost
```

### Step 4: Enable Storage Bucket (Already Done in SQL)

The `sql/init.sql` script already creates the `encrypted-files` bucket with proper RLS policies.

---

## Local Development Setup

### Option A: Full Local Setup (No Docker)

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (Maven will download them)
mvn clean install

# Create application.yml (already present, just verify)
cat src/main/resources/application.yml

# Run backend
mvn spring-boot:run
```

Backend will start at `http://localhost:8080`

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Copy .env template
cp .env.example .env

# Edit .env with Supabase credentials
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will start at `http://localhost:5173`

#### Access the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Health check: http://localhost:8080/api/health

### Option B: Local Setup with Docker

#### 1. Build Backend Image

```bash
cd backend
docker build -t encryption-backend:dev -f Dockerfile .
```

#### 2. Build Frontend Image

```bash
cd frontend
docker build -t encryption-frontend:dev -f Dockerfile .
```

#### 3. Run with Docker Compose

```bash
# From project root
docker-compose up
```

#### 4. Access the App

- Frontend: http://localhost
- Backend API: http://localhost:8080/api
- Health check: http://localhost:8080/api/health

---

## Docker Deployment

### Development Deployment (Local)

```bash
# From project root
docker-compose up --build

# To run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

#### Step 1: Tag Images

```bash
# Tag backend
docker tag encryption-backend:latest <your-registry>/encryption-backend:1.0.0

# Tag frontend
docker tag encryption-frontend:latest <your-registry>/encryption-frontend:1.0.0
```

#### Step 2: Push to Registry

```bash
# Login to registry (Docker Hub, GitHub Container Registry, etc.)
docker login

# Push images
docker push <your-registry>/encryption-backend:1.0.0
docker push <your-registry>/encryption-frontend:1.0.0
```

#### Step 3: Deploy on Server

```bash
# SSH into server
ssh user@server-ip

# Create directory
mkdir -p /opt/encryption-app
cd /opt/encryption-app

# Create docker-compose.yml with production settings
cat > docker-compose.yml << EOF
version: '3.8'
services:
  backend:
    image: <your-registry>/encryption-backend:1.0.0
    environment:
      - SERVER_PORT=8080
      - SUPABASE_URL=https://xxx.supabase.co
      - SUPABASE_ANON_KEY=***
      - SUPABASE_SERVICE_ROLE_KEY=***
      - SUPABASE_JWT_SECRET=***
      - CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
    ports:
      - "8080:8080"
    restart: always
    networks:
      - app-network

  frontend:
    image: <your-registry>/encryption-frontend:1.0.0
    environment:
      - VITE_SUPABASE_URL=https://xxx.supabase.co
      - VITE_SUPABASE_ANON_KEY=***
    ports:
      - "80:80"
    restart: always
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
EOF

# Set permissions
chmod 600 docker-compose.yml

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

---

## Running Tests

### Backend Unit Tests

```bash
cd backend

# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=AesEncryptionServiceTest

# Run with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Test Coverage

Expected coverage:
- Crypto layer: ≥95%
- Service layer: ≥90%
- Controller layer: ≥80%

---

## Monitoring & Maintenance

### View Logs

```bash
# Docker Compose logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Follow all logs
docker-compose logs -f
```

### Check Health

```bash
# Backend health
curl http://localhost:8080/api/health

# Frontend accessibility
curl http://localhost
```

### Database Backups

In Supabase:
1. Go to **Settings → Backups**
2. Enable automatic backups (daily recommended)
3. Download backups manually as needed

---

## Security Checklist (Production)

- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Environment variables stored securely (no .env in git)
- [ ] JWT secret changed from default
- [ ] CORS origins restricted to your domain
- [ ] Rate limiting enabled on API
- [ ] Database backups configured
- [ ] Log monitoring set up
- [ ] Firewall rules configured
- [ ] DDoS protection enabled (if using CDN)
- [ ] Regular security updates applied

---

## Troubleshooting

### Docker Issues

#### "Connection refused" to backend
```bash
# Check if backend is running
docker ps

# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

#### "Cannot connect to Supabase"
```bash
# Verify .env file
cat .env

# Check credentials
docker-compose exec backend env | grep SUPABASE

# Restart with correct env
docker-compose down
docker-compose up
```

### Frontend Issues

#### "CORS error" when uploading file
1. Check `CORS_ALLOWED_ORIGINS` in backend
2. Verify frontend URL matches CORS configuration
3. Restart backend after changing CORS

#### "Cannot find module" in frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend Issues

#### "Port 8080 already in use"
```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
SERVER_PORT=8081 mvn spring-boot:run
```

#### "JWT validation failed"
1. Verify `SUPABASE_JWT_SECRET` matches Supabase
2. Check JWT token format in request header
3. Verify token hasn't expired

### Supabase Issues

#### "Invalid credentials" error
1. Verify credentials in `.env`
2. Check credentials in Supabase dashboard
3. Try regenerating keys

#### "Storage bucket not found"
1. Run `sql/init.sql` in Supabase SQL editor
2. Verify `encrypted-files` bucket exists in Storage
3. Check RLS policies on bucket

---

## Performance Tuning

### Backend Performance

1. **Increase JVM heap size**
   ```bash
   -Xmx2g -Xms2g  # 2GB heap
   ```

2. **Configure multipart settings**
   ```yaml
   spring.servlet.multipart.max-file-size=5GB
   server.tomcat.max-http-post-size=5GB
   ```

3. **Connection pooling**
   - Already optimized in docker-compose

### Frontend Performance

1. **Build optimization**
   ```bash
   cd frontend
   npm run build
   # Check dist/ size
   ```

2. **Enable gzip compression** (in nginx.conf)
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/javascript;
   ```

---

## Upgrading

### Backend Upgrade

1. Build new image
   ```bash
   docker build -t encryption-backend:1.1.0 -f backend/Dockerfile .
   ```

2. Update docker-compose.yml with new version

3. Restart services
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Frontend Upgrade

Same process as backend:
```bash
docker build -t encryption-frontend:1.1.0 -f frontend/Dockerfile .
```

---

## Support

For issues or questions, refer to:
- README.md for features and API docs
- GitHub Issues for bug reports
- Project documentation for detailed info

---

**Last Updated**: April 2026  
**Version**: 1.0.0
