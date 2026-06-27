# EnFlow — VPS Docker Deployment Guide

## 📦 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Internet  │────▶│  Nginx (80/443) │───▶│  Next.js   │
│             │     │  Reverse Proxy │     │  (port 3020)│
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Certbot   │
                    │ (auto-renew)│
                    └─────────────┘
```

## 🚀 Quick Deploy

### 1. Clone & Prepare

```bash
git clone <your-repo> /home/ubuntu/cirux
cd /home/ubuntu/cirux
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
nano .env.local
```

Fill in your real credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.silvioalzate.shop
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_URL=https://evolution.silvioalzate.shop
```

### 3. Deploy

```bash
chmod +x deploy.sh
./deploy.sh cirux.silvioalzate.shop your-email@example.com
```

The script will:
- Install Docker & Docker Compose (if missing)
- Obtain SSL certificate from Let's Encrypt
- Build the Next.js production image
- Start all services

### 4. Verify

```bash
# Check containers
docker-compose ps

# Check app logs
docker-compose logs -f cirux-app

# Health check
curl https://cirux.silvioalzate.shop/api/health
```

## 🔧 Manual Commands

### Build & Start

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Stop

```bash
docker-compose down
```

### Update (after git pull)

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View Logs

```bash
# App logs
docker-compose logs -f cirux-app

# Nginx logs
docker-compose logs -f nginx

# All logs
docker-compose logs -f
```

### SSL Certificate Issues

```bash
# Force renew certificate
docker-compose run --rm certbot renew --force-renewal

# Or re-obtain
docker-compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email your-email@example.com --agree-tos \
  -d cirux.silvioalzate.shop
```

## 📁 File Structure

```
cirux/
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Services orchestration
├── nginx.conf              # Reverse proxy config
├── deploy.sh               # One-click deploy script
├── .dockerignore           # Build exclusions
├── .env.local              # Production secrets
└── src/
    └── app/
        └── api/
            └── health/
                └── route.ts   # Health check endpoint
```

## 🔒 Security Features

- **Non-root user** in container (uid: 1001)
- **Security headers** via Nginx (X-Frame-Options, CSP, etc.)
- **Rate limiting** on API routes (30 req/s)
- **SSL/TLS** with auto-renewal
- **Health checks** on container and load balancer
- **No secrets in image** — passed via env vars at runtime

## 🔄 CI/CD Pipeline (GitHub Actions example)

```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/ubuntu/cirux
            git pull
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
```

## 🐛 Troubleshooting

### Port 80/443 already in use
```bash
sudo lsof -i :80
sudo systemctl stop apache2  # or nginx
```

### Container won't start
```bash
docker-compose logs cirux-app
# Check if .env.local is present and valid
```

### SSL certificate expired
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Health check fails
```bash
# Test locally
curl http://localhost:3020/api/health
# Should return {"status":"ok"}
```

## 📊 Monitoring

Add to `docker-compose.yml` for monitoring:

```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

## 📝 Notes

- The app runs as non-root user inside container
- SSL certificates auto-renew every 12 hours (certbot checks)
- Nginx handles static file caching (1 year for `_next/static`)
- API routes have stricter rate limiting than general pages
- WebSocket connections supported for Supabase Realtime
