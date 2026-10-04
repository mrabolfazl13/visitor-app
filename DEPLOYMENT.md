# Deployment Guide - Server 2.189.255.225

## Prerequisites on Server

Ensure the following are installed on `ubuntu@2.189.255.225`:

```bash
# Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Git (optional, for pulling updates)
sudo apt-get install -y git

# rsync (for file transfer)
sudo apt-get install -y rsync
```

## Quick Deployment

### Option 1: Automated Deployment Script

From your local machine:

```bash
cd I:\Codes\Hamid
bash deploy-simple.sh
```

This will:
1. Copy all files to the server
2. Configure port 9105 for backend API
3. Build and start all Docker containers
4. Run database migrations
5. Create MinIO bucket

### Option 2: Manual Deployment

1. **Copy files to server:**
```bash
rsync -avz --exclude='node_modules' --exclude='__pycache__' \
    ./ ubuntu@2.189.255.225:~/b2b-sales-platform/
```

2. **SSH into server:**
```bash
ssh ubuntu@2.189.255.225
cd ~/b2b-sales-platform
```

3. **Create .env file:**
```bash
cp .env.example .env
# Edit .env with production values
```

4. **Start services:**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

5. **Run migrations:**
```bash
docker compose exec backend alembic upgrade head
```

6. **Create MinIO bucket:**
```bash
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/product-images
```

## Access Points

After deployment:

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://2.189.255.225:9105 | - |
| API Documentation | http://2.189.255.225:9105/docs | - |
| Desktop Web App | http://2.189.255.225:80 | - |
| MinIO Console | http://2.189.255.225:9001 | minioadmin / minioadmin |
| Flower (Celery) | http://2.189.255.225:5555 | - |

## Configuration

### Environment Variables (.env)

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/b2b_sales
REDIS_URL=redis://redis:6379/0
JWT_SECRET=<generate-secure-random-string>
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=product-images
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
APP_ENV=production
DEBUG=false
CORS_ORIGINS=http://2.189.255.225:9105,http://2.189.255.225:80
```

### Port Mapping

| Container Port | Host Port | Service |
|----------------|-----------|---------|
| 8000 | 9105 | Backend API |
| 80 | 80 | Nginx (Desktop Web) |
| 5432 | 5432 | PostgreSQL |
| 6379 | 6379 | Redis |
| 9000 | 9000 | MinIO API |
| 9001 | 9001 | MinIO Console |
| 5555 | 5555 | Flower |

## Maintenance

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f celery_worker
```

### Restart Services
```bash
docker compose restart backend
docker compose restart celery_worker
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose exec backend alembic upgrade head
```

### Backup Database
```bash
docker compose exec postgres pg_dump -U postgres b2b_sales > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
cat backup_file.sql | docker compose exec -T postgres psql -U postgres b2b_sales
```

## Troubleshooting

### Backend not starting
```bash
docker compose logs backend
# Check DATABASE_URL and other env vars
```

### Database connection issues
```bash
docker compose exec postgres pg_isready
docker compose logs postgres
```

### MinIO bucket not created
```bash
docker compose exec minio mc ls local/
docker compose exec minio mc mb local/product-images
```

### Check service health
```bash
docker compose ps
curl http://2.189.255.225:9105/health
```

## Security Notes

1. **Change default passwords** in production
2. **Use HTTPS** with Let's Encrypt or similar
3. **Restrict CORS origins** to known domains
4. **Rotate JWT_SECRET** regularly
5. **Enable firewall** (ufw) on server
6. **Set up fail2ban** for SSH protection

```bash
# Enable firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 9105/tcp # Backend API
sudo ufw enable

# Install fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
```

## Monitoring

### Resource Usage
```bash
docker stats
```

### Disk Usage
```bash
docker system df
du -sh ~/b2b-sales-platform/*
```

### Clean up old containers/images
```bash
docker system prune -a
```
