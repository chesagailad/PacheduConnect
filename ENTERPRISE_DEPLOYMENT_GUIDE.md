/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: ENTERPRISE_DEPLOYMENT_GUIDE - handles application functionality
 */

# Enterprise Deployment Guide for PacheduConnect

## Overview

This guide provides comprehensive instructions for deploying the PacheduConnect remittance platform in enterprise environments with high security, compliance, and scalability requirements for financial services.

## Pre-Deployment Requirements

### Infrastructure Requirements

#### Hardware Specifications
- **Application Servers**: 4+ CPU cores, 16GB+ RAM, SSD storage
- **Database Servers**: 8+ CPU cores, 32GB+ RAM, NVMe SSD storage
- **Cache Servers**: 4+ CPU cores, 16GB+ RAM, SSD storage
- **Load Balancers**: 2+ CPU cores, 8GB+ RAM
- **Monitoring Servers**: 4+ CPU cores, 16GB+ RAM

#### Network Requirements
- **Bandwidth**: Minimum 100Mbps, recommended 1Gbps+
- **Latency**: <50ms between application and database
- **Redundancy**: Multiple network paths
- **Firewall**: Enterprise-grade firewall protection
- **VPN**: Secure remote access for administrators

#### Storage Requirements
- **Database**: 500GB+ NVMe SSD with RAID 10
- **Backup Storage**: 2TB+ with daily backups
- **Log Storage**: 1TB+ for comprehensive logging
- **File Storage**: 500GB+ for document storage

### Security Requirements

#### Network Security
- **Firewall Configuration**: Restrict access to necessary ports only
- **VPN Access**: Secure remote administration
- **DDoS Protection**: CloudFlare or similar service
- **SSL/TLS**: TLS 1.3 for all communications
- **Network Segmentation**: Separate production, staging, and development

#### Access Control
- **SSH Key Authentication**: Disable password authentication
- **Multi-Factor Authentication**: Required for all admin access
- **Role-Based Access Control**: Granular permissions
- **Session Management**: Secure session handling
- **Audit Logging**: Comprehensive access logging

### Compliance Requirements

#### Financial Services Compliance
- **PCI-DSS Level 1**: Payment card data protection
- **FICA (South Africa)**: Anti-money laundering compliance
- **PSD2 (EU)**: Payment services directive
- **GDPR**: Data protection and privacy
- **KYC/AML**: Know your customer requirements

#### Security Standards
- **ISO 27001**: Information security management
- **SOC 2 Type II**: Security, availability, and confidentiality
- **NIST Cybersecurity Framework**: Risk management
- **OWASP Top 10**: Web application security

## Deployment Architecture

### Production Environment

#### High Availability Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Load Balancer │    │   Load Balancer │
│   (Primary)     │    │   (Secondary)   │    │   (Tertiary)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  App Server 1   │    │  App Server 2   │    │  App Server 3   │
│  (Primary)      │    │  (Secondary)    │    │  (Tertiary)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Database Master │    │ Database Slave  │    │ Database Slave  │
│ (Primary)       │    │ (Secondary)     │    │ (Tertiary)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Security Zones
- **DMZ**: Load balancers and public-facing services
- **Application Zone**: Application servers and services
- **Database Zone**: Database servers and storage
- **Management Zone**: Monitoring and administration

### Container Orchestration

#### Docker Compose Production
```yaml
version: '3.8'

services:
  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./deployment/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

  # Application Servers
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - ./logs:/app/logs
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./deployment/postgres/init:/docker-entrypoint-initdb.d
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

  # Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G

  # Monitoring
  prometheus:
    image: prom/prometheus
    volumes:
      - ./deployment/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

## Security Configuration

### SSL/TLS Configuration

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name pacheduconnect.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Security

#### PostgreSQL Security Configuration
```sql
-- Create secure roles
CREATE ROLE pachedu_app WITH LOGIN PASSWORD 'secure_password';
CREATE ROLE pachedu_readonly WITH LOGIN PASSWORD 'readonly_password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE pachedu_db TO pachedu_app;
GRANT USAGE ON SCHEMA public TO pachedu_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pachedu_app;

-- Read-only role for monitoring
GRANT CONNECT ON DATABASE pachedu_db TO pachedu_readonly;
GRANT USAGE ON SCHEMA public TO pachedu_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pachedu_readonly;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';

-- Enable logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
```

## Monitoring and Alerting

### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'pachedu-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'pachedu-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
```

### Grafana Dashboards

#### Application Metrics Dashboard
- **Response Time**: Average, 95th percentile, 99th percentile
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Active Users**: Concurrent user sessions
- **Transaction Volume**: Daily transaction amounts

#### Security Dashboard
- **Failed Login Attempts**: Authentication failures
- **Suspicious Activities**: Fraud detection alerts
- **API Rate Limiting**: Rate limit violations
- **SSL Certificate Status**: Certificate expiration
- **Database Access**: Unusual database queries

#### Infrastructure Dashboard
- **CPU Usage**: Server CPU utilization
- **Memory Usage**: RAM utilization
- **Disk I/O**: Storage performance
- **Network Traffic**: Bandwidth usage
- **Database Performance**: Query response times

## Backup and Disaster Recovery

### Backup Strategy

#### Database Backups
```bash
#!/bin/bash
# Daily database backup script

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="pachedu_db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -h localhost -U postgres -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://pachedu-backups/postgres/
```

#### Application Backups
```bash
#!/bin/bash
# Application configuration backup

CONFIG_DIR="/app/config"
BACKUP_DIR="/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup configuration files
tar -czf $BACKUP_DIR/config_$DATE.tar.gz $CONFIG_DIR

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/config_$DATE.tar.gz s3://pachedu-backups/config/
```

### Disaster Recovery Plan

#### Recovery Time Objectives (RTO)
- **Critical Systems**: 4 hours
- **Important Systems**: 8 hours
- **Non-Critical Systems**: 24 hours

#### Recovery Point Objectives (RPO)
- **Database**: 15 minutes
- **Application**: 1 hour
- **Configuration**: 4 hours

#### Recovery Procedures
1. **Infrastructure Recovery**
   - Restore from cloud backups
   - Reconfigure load balancers
   - Restart application services

2. **Database Recovery**
   - Restore from latest backup
   - Apply transaction logs
   - Verify data integrity

3. **Application Recovery**
   - Deploy application containers
   - Restore configuration files
   - Verify service connectivity

## Performance Optimization

### Application Optimization

#### Node.js Performance
```javascript
// PM2 configuration for production
module.exports = {
  apps: [{
    name: 'pachedu-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_users_email ON users(email);

-- Partition large tables
CREATE TABLE transactions_partitioned (
  LIKE transactions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE transactions_2024_01 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Caching Strategy

#### Redis Caching
```javascript
// Cache configuration
const cacheConfig = {
  // User session cache
  session: {
    ttl: 3600, // 1 hour
    max: 10000
  },
  
  // Transaction cache
  transactions: {
    ttl: 300, // 5 minutes
    max: 5000
  },
  
  // Exchange rates cache
  rates: {
    ttl: 60, // 1 minute
    max: 1000
  }
};
```

## Security Hardening

### Application Security

#### Input Validation
```javascript
// Comprehensive input validation
const Joi = require('joi');

const transactionSchema = Joi.object({
  amount: Joi.number().positive().max(100000).required(),
  currency: Joi.string().valid('ZAR', 'USD', 'EUR').required(),
  recipientEmail: Joi.string().email().required(),
  description: Joi.string().max(500).required()
});
```

#### Rate Limiting
```javascript
// Advanced rate limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts',
});
```

### Infrastructure Security

#### Firewall Rules
```bash
# UFW firewall configuration
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application ports
ufw allow 5000/tcp
ufw allow 3000/tcp

# Enable firewall
ufw enable
```

## Compliance Monitoring

### Audit Logging
```javascript
// Comprehensive audit logging
const auditLogger = {
  logTransaction: (userId, transactionId, action, details) => {
    logger.info('Transaction Audit', {
      userId,
      transactionId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  },
  
  logSecurityEvent: (event, severity, details) => {
    logger.warn('Security Event', {
      event,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Compliance Reporting
```javascript
// Automated compliance reporting
const complianceReporter = {
  generateMonthlyReport: async () => {
    const report = {
      period: new Date().toISOString().slice(0, 7),
      transactions: await getTransactionStats(),
      securityEvents: await getSecurityEvents(),
      complianceScore: await calculateComplianceScore()
    };
    
    await saveComplianceReport(report);
    return report;
  }
};
```

## Deployment Checklist

### Pre-Deployment
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Database optimized
- [ ] Load testing completed

### Deployment
- [ ] Infrastructure provisioned
- [ ] Containers deployed
- [ ] Database migrated
- [ ] SSL certificates configured
- [ ] Monitoring activated
- [ ] Backup procedures active
- [ ] Security scanning completed
- [ ] Performance baseline established

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Backup verification completed
- [ ] Security scan passed
- [ ] Performance metrics acceptable
- [ ] Compliance audit completed
- [ ] Documentation updated
- [ ] Team training completed

## Conclusion

This enterprise deployment guide ensures that PacheduConnect is deployed with the highest standards of security, compliance, and performance required for financial services operations. Regular updates and continuous monitoring are essential to maintain these standards.

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Next Review**: 2024-04-01  
**Owner**: PacheduConnect DevOps Team 