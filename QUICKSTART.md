# Quick Start - Deploy to Server

## One-Command Deployment

From your Windows machine (Git Bash):

```bash
cd /i/Codes/Hamid
bash deploy-to-server.sh
```

## What This Does

1. ✅ Generates secure production environment
2. ✅ Copies all files to `ubuntu@2.189.255.225`
3. ✅ Builds and starts all Docker containers
4. ✅ Runs database migrations
5. ✅ Creates MinIO bucket for product images
6. ✅ Seeds database with test data:
   - 1 Admin (admin@b2bsales.com / admin123)
   - 10 Sellers (seller1-10@b2bsales.com / seller1-10123)
   - 100 Products
   - 100 Customers

## After Deployment

### Test Backend API
```bash
curl http://2.189.255.225:9105/health
```

Expected response:
```json
{"status": "healthy"}
```

### View API Documentation
Open in browser: http://2.189.255.225:9105/docs

### Login to Test
```bash
curl -X POST http://2.189.255.225:9105/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@b2bsales.com", "password": "admin123"}'
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://2.189.255.225:9105 | - |
| API Docs | http://2.189.255.225:9105/docs | - |
| Desktop Web | http://2.189.255.225:80 | - |
| MinIO Console | http://2.189.255.225:9001 | minioadmin / minioadmin |

## Troubleshooting

### If deployment fails:
```bash
# SSH into server
ssh ubuntu@2.189.255.225

# Check logs
cd ~/b2b-sales-platform
docker compose logs backend

# Restart services
docker compose restart
```

### To view all running containers:
```bash
ssh ubuntu@2.189.255.225 'docker ps'
```

### To check backend logs:
```bash
ssh ubuntu@2.189.255.225 'cd ~/b2b-sales-platform && docker compose logs -f backend'
```

## Next Steps

After successful deployment:
1. Test API endpoints via Swagger docs
2. Configure HTTPS (Let's Encrypt)
3. Set up firewall rules
4. Add remaining features incrementally
