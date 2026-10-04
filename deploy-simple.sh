#!/bin/bash
set -e

# Server configuration
SERVER_IP="2.189.255.225"
SERVER_USER="ubuntu"
PROJECT_NAME="b2b-sales-platform"
BACKEND_PORT="9105"

echo "=========================================="
echo "Deploying B2B Sales Platform Backend"
echo "=========================================="
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Port: $BACKEND_PORT"
echo ""

cd "$(dirname "$0")"

# Create production .env
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/b2b_sales
REDIS_URL=redis://redis:6379/0
JWT_SECRET=super-secret-jwt-key-change-in-production-$(date +%s)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=product-images
MINIO_SECURE=false
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
APP_ENV=production
DEBUG=false
CORS_ORIGINS=http://$SERVER_IP:$BACKEND_PORT,http://localhost:$BACKEND_PORT
EOF

# Copy to server
echo "Copying files to server..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
    --exclude='mobile' --exclude='desktop' --exclude='.venv' \
    ./ $SERVER_USER@$SERVER_IP:~/$PROJECT_NAME/

# Deploy on server
echo "Deploying on server..."
ssh $SERVER_USER@$SERVER_IP bash << 'ENDSSH'
set -e
cd ~/b2b-sales-platform

# Stop existing
docker compose down 2>/dev/null || true

# Update port in docker-compose.yml
sed -i "s/- \"8000:8000\"/- \"9105:8000\"/" docker-compose.yml

# Build and start
docker compose up -d --build

# Wait for services
echo "Waiting for services to start..."
sleep 15

# Run migrations
docker compose exec -T backend alembic upgrade head 2>/dev/null || echo "DB already migrated"

# Create MinIO bucket
docker compose exec -T minio sh -c "mc alias set local http://localhost:9000 minioadmin minioadmin && mc mb local/product-images" 2>/dev/null || echo "MinIO bucket exists"

echo ""
echo "✓ Deployment complete!"
echo "Backend API: http://2.189.255.225:9105"
echo "API Docs: http://2.189.255.225:9105/docs"
ENDSSH

echo ""
echo "✓ Done! Backend is running at http://$SERVER_IP:$BACKEND_PORT"
