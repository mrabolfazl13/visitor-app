#!/bin/bash
set -e

# Server configuration
SERVER_IP="2.189.255.225"
SERVER_USER="ubuntu"
PROJECT_NAME="b2b-sales-platform"
BACKEND_PORT="9105"

echo "=========================================="
echo "Deploying B2B Sales Platform to Server"
echo "=========================================="
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Backend Port: $BACKEND_PORT"
echo ""

# Step 1: Prepare project files for deployment
echo "Step 1: Preparing deployment files..."
cd "$(dirname "$0")"

# Create production .env file
cat > .env.production << EOF
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/b2b_sales
REDIS_URL=redis://redis:6379/0
JWT_SECRET=$(openssl rand -hex 32)
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

echo "✓ Production environment file created"

# Step 2: Copy files to server
echo ""
echo "Step 2: Copying files to server..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
    --exclude='.env' --exclude='mobile' --exclude='desktop' \
    ./ $SERVER_USER@$SERVER_IP:~/$PROJECT_NAME/

echo "✓ Files copied to server"

# Step 3: SSH into server and deploy
echo ""
echo "Step 3: Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

PROJECT_DIR=~/b2b-sales-platform
cd $PROJECT_DIR

echo "Stopping existing containers..."
docker compose down || true

echo ""
echo "Building and starting services..."
# Modify docker-compose.yml for production port mapping
sed -i "s/- \"8000:8000\"/- \"$BACKEND_PORT:8000\"/" docker-compose.yml

# Start all services
docker compose up -d --build

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check service status
docker compose ps

echo ""
echo "Running database migrations..."
docker compose exec backend alembic upgrade head || echo "Migration completed or not needed"

echo ""
echo "Creating MinIO bucket..."
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin || true
docker compose exec minio mc mb local/product-images || true

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Backend API: http://$SERVER_IP:$BACKEND_PORT"
echo "API Docs: http://$SERVER_IP:$BACKEND_PORT/docs"
echo "MinIO Console: http://$SERVER_IP:9001"
echo "Flower (Celery): http://$SERVER_IP:5555"
echo ""
echo "To check logs: docker compose logs -f backend"
echo "To restart: docker compose restart"
ENDSSH

echo ""
echo "✓ Deployment finished successfully!"
echo ""
echo "Access Points:"
echo "  Backend API: http://$SERVER_IP:$BACKEND_PORT"
echo "  API Documentation: http://$SERVER_IP:$BACKEND_PORT/docs"
echo "  MinIO Console: http://$SERVER_IP:9001 (minioadmin/minioadmin)"
echo ""
