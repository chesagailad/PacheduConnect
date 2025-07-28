/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: LOCALHOST_REFERENCES_FIXED - handles application functionality
 */

# Localhost References Fixed

This document summarizes the fixes made to eliminate hardcoded localhost references throughout the PacheduConnect codebase.

## Summary of Changes

### 1. Frontend API Configuration (`frontend/src/config/api.ts`)
- **Fixed**: Removed hardcoded `http://localhost:5001` fallback
- **Fixed**: Port inconsistency (was 5001, now correctly defaults to 5000)
- **Added**: Environment-aware API URL detection
- **Production**: Uses relative paths (`/api`) when `NODE_ENV=production`
- **Development**: Uses `NEXT_PUBLIC_API_URL` or defaults to `http://localhost:5000`

### 2. Next.js Configuration Files
#### Frontend (`frontend/next.config.js`)
- **Fixed**: Hardcoded `localhost` in image domains (now only in development)
- **Fixed**: Hardcoded API rewrite destination
- **Added**: `API_REWRITE_URL` environment variable support
- **Added**: `NEXT_PUBLIC_IMAGE_DOMAINS` for additional image domains

#### Admin Dashboard (`admin-dashboard/next.config.js`)
- **Fixed**: Same improvements as frontend config
- **Added**: Environment-aware image domains and API rewrites

### 3. Frontend Components and Pages
Updated all components and pages to use the centralized API configuration:
- `PaymentProcessor.tsx`
- `NotificationBell.tsx`  
- `CurrencyConverter.tsx`
- `transactions/page.tsx`
- `send-money/page.tsx`
- `profile/page.tsx`
- `payment/success/page.tsx`
- `dashboard/page.tsx`
- `auth/page.tsx`

### 4. Backend Configuration (`backend/src/server.js`)
- **Fixed**: Hardcoded CORS origins
- **Added**: Environment-aware CORS configuration
- **Production**: Defaults to `pachedu.com` domains
- **Development**: Includes `localhost:3000`, `localhost:3001`, and `127.0.0.1` variants

### 5. Backend Test Files
- **Fixed**: `test-send-money.js` - now uses `API_URL` environment variable
- **Fixed**: `healthcheck.js` - configurable host and path

### 6. Deployment Configuration
- **Fixed**: `nginx.conf` - uses production domain names
- **Fixed**: `prometheus.yml` - environment variable support

## Environment Variables

### Required for Production

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.pachedu.com
API_REWRITE_URL=https://api.pachedu.com

# CORS Origins (Backend)
ALLOWED_ORIGINS=https://pachedu.com,https://www.pachedu.com,https://admin.pachedu.com

# Health Check Configuration
HEALTH_CHECK_HOST=api.pachedu.com
HEALTH_CHECK_PATH=/health

# Image Domains (Optional)
NEXT_PUBLIC_IMAGE_DOMAINS=cdn.pachedu.com,assets.pachedu.com

# Monitoring (Optional)
PROMETHEUS_HOST=monitoring.pachedu.com
PROMETHEUS_PORT=9090
```

### Development Defaults

When environment variables are not set, the application falls back to:
- **Frontend API**: `http://localhost:5000`
- **CORS Origins**: `http://localhost:3000`, `http://localhost:3001`
- **Health Check**: `localhost:5000/health`
- **Image Domains**: `localhost` (development only)

## Migration Notes

### Before Deployment
1. Set all required environment variables
2. Update DNS records to point to your servers
3. Configure SSL certificates for HTTPS domains
4. Test API connectivity between frontend and backend

### Port Consistency
- **Backend**: Port 5000 (configurable via `PORT`)
- **Frontend**: Port 3000 (Next.js default)
- **Admin Dashboard**: Port 3001 (typical setup)

### Docker Compose
The `docker-compose.yml` already has environment variable placeholders that work with these changes:
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `ALLOWED_ORIGINS`

## Testing

To verify the fixes work correctly:

1. **Development**: Run without environment variables - should use localhost defaults
2. **Production**: Set environment variables - should use production URLs
3. **API Calls**: Verify all frontend pages make requests to correct endpoints
4. **CORS**: Test cross-origin requests work properly
5. **Health Checks**: Verify health check endpoints respond correctly

## Benefits

- ✅ **No hardcoded URLs** - fully configurable via environment variables
- ✅ **Environment-aware** - different defaults for development vs production
- ✅ **Port consistency** - all references use correct backend port (5000)
- ✅ **Centralized config** - single source of truth for API URLs
- ✅ **Production ready** - proper HTTPS domains and security headers
- ✅ **Docker compatible** - works with existing docker-compose setup