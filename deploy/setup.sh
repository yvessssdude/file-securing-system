#!/bin/bash
set -e

echo "========================================"
echo " Secure File Sharing System - Deploy"
echo "========================================"
echo ""

cd "$(dirname "$0")"

if ! command -v docker &> /dev/null; then
    echo "[1/4] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "  Docker installed. You may need to log out and back in for group changes."
else
    echo "[1/4] Docker found"
fi

if ! docker compose version &> /dev/null; then
    echo "  Installing Docker Compose plugin..."
    sudo apt-get update -qq && sudo apt-get install -y -qq docker-compose-plugin
fi

if [ ! -f .env ]; then
    echo "[2/4] Generating .env from .env.example..."
    cp .env.example .env

    SA_PASS=$(python3 -c "
import secrets, string
safe_sym = '-._~'
all_chars = string.ascii_uppercase + string.ascii_lowercase + string.digits + safe_sym
pw = [secrets.choice(string.ascii_uppercase),
      secrets.choice(string.ascii_lowercase),
      secrets.choice(string.digits),
      secrets.choice(safe_sym)]
pw += [secrets.choice(all_chars) for _ in range(12)]
secrets.SystemRandom().shuffle(pw)
print(''.join(pw))
")
    SECRET=$(openssl rand -base64 32)

    sed -i "s/CHANGE_ME_SA_PASSWORD/$SA_PASS/g" .env
    sed -i "s/CHANGE_ME_SECRET_KEY/$SECRET/g" .env

    echo "  SA_PASSWORD: $SA_PASS"
    echo "  SECRET_KEY:  $SECRET"
    echo "  Save these if you need to reconnect manually."
else
    echo "[2/4] .env exists, skipping"
fi

echo "[3/4] Starting services..."
docker compose up -d

echo ""
echo "[4/4] Waiting for services to initialize (may take 1-2 minutes)..."
echo "  Checking backend health..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "  Backend is healthy!"
        break
    fi
    echo "  Waiting... attempt $i"
    sleep 5
done

echo ""
echo "========================================"
echo " Deployment Complete"
echo "========================================"
echo ""
echo "Cloudflare Tunnel URL:"
echo "  docker compose logs cloudflared | grep -o 'https://[a-z0-9.-]*\.trycloudflare\.com'"
echo ""
echo "Backend health check:"
echo "  curl http://localhost:8000/api/health"
echo ""
echo "Logs:"
echo "  docker compose logs -f"
echo ""
echo "Stop all services:"
echo "  docker compose down"
