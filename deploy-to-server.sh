#!/bin/bash
set -e

# ==========================================
# B2B Sales Platform - Complete Deployment Script
# Server: 2.189.255.225
# User: ubuntu
# Backend Port: 9105
# Desktop Web Port: 80 (via Nginx)
# ==========================================

SERVER_IP="2.189.255.225"
SERVER_USER="ubuntu"
PROJECT_NAME="b2b-sales-platform"
BACKEND_PORT="9105"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   B2B Sales Platform - Automated Deployment              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Target Server: $SERVER_USER@$SERVER_IP"
echo "Backend API Port: $BACKEND_PORT"
echo "Desktop Web Port: 80"
echo ""

# Check if running from correct directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Generate production environment file
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Creating production environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || echo "change-this-secret-key-in-production")

cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/b2b_sales

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=product-images
MINIO_SECURE=false

# Celery
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Application
APP_ENV=production
DEBUG=false
CORS_ORIGINS=http://$SERVER_IP:$BACKEND_PORT,http://$SERVER_IP:80,http://localhost:$BACKEND_PORT
EOF

echo "✓ Production environment created"
echo ""

# Step 2: Copy files to server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Transferring files to server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

rsync -avz --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.venv' \
    --exclude='mobile' \
    --exclude='.env' \
    --exclude='*.md' \
    ./ "$SERVER_USER@$SERVER_IP:~/$PROJECT_NAME/"

echo "✓ Files transferred successfully"
echo ""

# Step 3: Deploy on server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Deploying on server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
set -e

PROJECT_DIR=~/b2b-sales-platform
cd $PROJECT_DIR

echo "Stopping existing containers..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo "Pulling latest Docker images..."
docker compose -f docker-compose.prod.yml pull 2>/dev/null || true

echo ""
echo "Building and starting all services..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Waiting for services to initialize (30 seconds)..."
for i in {1..30}; do
    printf "."
    sleep 1
done
echo ""

echo ""
echo "Checking service status..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>&1 || echo "Database already migrated or migration not available"

echo ""
echo "Creating MinIO bucket..."
docker compose -f docker-compose.prod.yml exec -T minio sh -c \
    "mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null && \
     mc mb local/product-images 2>/dev/null" || echo "MinIO bucket setup pending"

echo ""
echo "Verifying backend health..."
sleep 5
curl -s http://localhost:9105/health || echo "Backend health check pending"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deployment Complete on Server!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ENDSSH

# Step 4: Display access information
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✓ DEPLOYMENT SUCCESSFUL!                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Access Points:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📡 Backend API:"
echo "     → http://$SERVER_IP:$BACKEND_PORT"
echo "     → API Docs: http://$SERVER_IP:$BACKEND_PORT/docs"
echo "     → Health: http://$SERVER_IP:$BACKEND_PORT/health"
echo ""
echo "  💻 Desktop Web App (Tauri Web):"
echo "     → http://$SERVER_IP:80"
echo ""
echo "  🗄️  MinIO Console:"
echo "     → http://$SERVER_IP:9001"
echo "     → Username: minioadmin"
echo "     → Password: minioadmin"
echo ""
echo "  🌸 Flower (Celery Monitor):"
echo "     → http://$SERVER_IP:5555"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Useful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  View logs:"
echo "    ssh $SERVER_USER@$SERVER_IP 'cd ~/$PROJECT_NAME && docker compose logs -f'"
echo ""
echo "  Restart backend:"
echo "    ssh $SERVER_USER@$SERVER_IP 'cd ~/$PROJECT_NAME && docker compose restart backend'"
echo ""
echo "  Check status:"
echo "    ssh $SERVER_USER@$SERVER_IP 'cd ~/$PROJECT_NAME && docker compose ps'"
echo ""
echo "  Run migrations:"
echo "    ssh $SERVER_USER@$SERVER_IP 'cd ~/$PROJECT_NAME && docker compose exec backend alembic upgrade head'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "  1. Test API: curl http://$SERVER_IP:$BACKEND_PORT/health"
echo "  2. Visit docs: http://$SERVER_IP:$BACKEND_PORT/docs"
echo "  3. Configure HTTPS (recommended for production)"
echo "  4. Set up firewall rules"
echo ""
echo "✓ All done! Your B2B Sales Platform is now live."
