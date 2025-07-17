# Frontend & Docker Issues - Troubleshooting Guide

## Issues Identified & Resolved

### 1. Docker Not Installed
**Problem**: `docker: command not found`
**Solution**: Installed Docker and Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
```

### 2. Docker Daemon Not Running
**Problem**: Docker daemon wasn't started (systemd not available)
**Solution**: 
```bash
# Start Docker daemon manually
sudo dockerd &

# Fix socket permissions
sudo chmod 666 /var/run/docker.sock

# Add user to docker group (requires logout/login to take effect)
sudo usermod -aG docker $USER
```

### 3. Environment Configuration
**Status**: ✅ Environment file (`.env`) exists and is properly configured
- Database settings configured
- Application ports set (Frontend: 3000, Backend: 5000, Admin: 3001)

### 4. Frontend Dependencies
**Status**: ✅ Frontend dependencies installed successfully
```bash
cd frontend
npm install
```

## Current Status

### Docker
- ✅ Docker 27.5.1 installed and working
- ✅ Docker Compose 2.33.0 installed
- ✅ Docker daemon running
- ✅ No permission issues

### Frontend
- ✅ Dependencies installed
- ✅ Development server started
- 🔄 Running on localhost:3000 (development mode)

## Starting the Application

### Option 1: Development Mode (Currently Running)
```bash
cd frontend
npm run dev
```
Frontend will be available at: http://localhost:3000

### Option 2: Full Docker Stack
```bash
# From project root
docker compose up -d

# Or just specific services
docker compose up -d postgres redis backend frontend
```

### Option 3: Individual Services
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend  
cd frontend
npm install
npm run dev

# Admin Dashboard
cd admin-dashboard
npm install
npm run dev
```

## Services Overview

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| Frontend | 3000 | 🔄 Running | Next.js web app |
| Backend | 5000 | ⏸️ Not started | Node.js API |
| Admin | 3001 | ⏸️ Not started | Admin dashboard |
| PostgreSQL | 5432 | ⏸️ Not started | Database |
| Redis | 6379 | ⏸️ Not started | Cache |
| Nginx | 80/443 | ⏸️ Not started | Reverse proxy |

## Next Steps

1. **Start Backend Services** (if needed):
   ```bash
   docker compose up -d postgres redis backend
   ```

2. **Check Frontend Status**:
   - Visit: http://localhost:3000
   - Check logs: `docker compose logs frontend` (if using Docker)

3. **Troubleshooting Commands**:
   ```bash
   # Check running containers
   docker ps
   
   # View logs
   docker compose logs [service-name]
   
   # Restart a service
   docker compose restart [service-name]
   
   # Check frontend dev server
   ps aux | grep npm
   ```

## Common Issues & Solutions

### Frontend Not Loading
1. **Check if port 3000 is accessible**:
   ```bash
   curl -I http://localhost:3000
   ```

2. **Check for port conflicts**:
   ```bash
   netstat -tulpn | grep :3000
   ```

3. **Restart frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### Docker Container Issues
1. **Check container status**:
   ```bash
   docker compose ps
   ```

2. **View detailed logs**:
   ```bash
   docker compose logs -f frontend
   ```

3. **Rebuild containers**:
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

### Environment Variable Issues
1. **Verify .env file exists and has correct values**
2. **Check environment variable loading in Next.js**:
   - Variables must start with `NEXT_PUBLIC_` for frontend use
   - Server-side variables don't need the prefix

## Architecture Notes

- **Frontend**: Next.js 14 with standalone output for Docker
- **Backend**: Node.js with Express
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx
- **Container Orchestration**: Docker Compose

## Development Workflow

1. **Local Development** (recommended):
   ```bash
   # Terminal 1: Start backend services
   docker compose up -d postgres redis
   
   # Terminal 2: Start backend
   cd backend && npm run dev
   
   # Terminal 3: Start frontend
   cd frontend && npm run dev
   ```

2. **Full Docker Development**:
   ```bash
   docker compose up -d
   ```

3. **Production Deployment**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

---

**Status**: Frontend Docker issues resolved ✅
**Next**: Access application at http://localhost:3000