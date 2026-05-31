#!/bin/bash
# =============================================================
#  EC2 Ubuntu Setup Script — my-event-project
#  Run this on a fresh Ubuntu 22.04 EC2 instance as the
#  ubuntu user (sudo access required).
#
#  Usage:
#    chmod +x ec2_setup.sh
#    ./ec2_setup.sh
# =============================================================

set -e  # Exit immediately if any command fails
echo "======================================================"
echo " Starting EC2 Setup for my-event-project"
echo "======================================================"

# ─── STEP 1: Update system & install system packages ─────────
echo ""
echo "[1/10] Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    git \
    curl \
    nginx \
    redis-server \
    mysql-server \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential

echo "✅ System packages installed"

# ─── STEP 2: Install Node.js 20 (for Angular build) ──────────
echo ""
echo "[2/10] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "✅ Node.js $(node -v) installed"

# ─── STEP 3: Clone the project ───────────────────────────────
echo ""
echo "[3/10] Cloning repository..."
cd /home/ubuntu

# ⚠️  Replace this URL with your actual GitHub repo URL
REPO_URL="https://github.com/YOUR_GITHUB_USERNAME/my-event-project.git"
git clone "$REPO_URL" my-event-project
cd my-event-project

echo "✅ Repository cloned to /home/ubuntu/my-event-project"

# ─── STEP 4: Set up Python virtual environment ───────────────
echo ""
echo "[4/10] Setting up Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
echo "✅ Python venv ready with all packages"

# ─── STEP 5: Configure MySQL ─────────────────────────────────
echo ""
echo "[5/10] Configuring MySQL..."

# Secure MySQL and create database + user
# ⚠️  Change these values before running!
DB_ROOT_PASS="your-root-password"
DB_NAME="event_db"
DB_USER="event_user"
DB_PASS="your-strong-db-password"   # must match .env DB_PASSWORD

sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_ROOT_PASS}';"
sudo mysql -u root -p"${DB_ROOT_PASS}" -e "
    CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
    GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
    FLUSH PRIVILEGES;
"
echo "✅ MySQL database '${DB_NAME}' and user '${DB_USER}' created"

# ─── STEP 6: Create .env file ────────────────────────────────
echo ""
echo "[6/10] Creating .env file..."

# ⚠️  IMPORTANT: Update ALL values below before running this script!
cat > backend/.env << 'EOF'
DJANGO_SECRET_KEY=REPLACE-WITH-A-50-CHAR-RANDOM-STRING-GENERATE-ONE-BELOW
DEBUG=False
DB_ENGINE=mysql
DB_NAME=event_db
DB_USER=event_user
DB_PASSWORD=your-strong-db-password
DB_HOST=127.0.0.1
DB_PORT=3306
ALLOWED_HOSTS=YOUR_EC2_PUBLIC_IP
CORS_ALLOWED_ORIGINS=http://YOUR_EC2_PUBLIC_IP,https://github.com/Planora-x2/my-event-project.git
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
EOF

echo "⚠️  .env file created — EDIT IT NOW with real values before continuing!"
echo "    Run: nano backend/.env"
echo ""
read -p "Press ENTER after you have edited the .env file to continue..."

# ─── STEP 7: Django setup ────────────────────────────────────
echo ""
echo "[7/10] Running Django setup..."
source venv/bin/activate
cd backend

# Run database migrations
python manage.py migrate

# Collect static files (admin CSS, etc.) → Nginx serves these
python manage.py collectstatic --noinput

echo "✅ Django migrations done, static files collected"
cd ..

# ─── STEP 8: Build Angular frontend ──────────────────────────
echo ""
echo "[8/10] Building Angular frontend..."
cd frontend
npm ci                  # clean install (uses package-lock.json exactly)
npm run build           # outputs to frontend/dist/frontend/browser/
cd ..
echo "✅ Angular build complete"

# ─── STEP 9: Set up Nginx ────────────────────────────────────
echo ""
echo "[9/10] Configuring Nginx..."

# Get EC2 public IP dynamically
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Copy nginx.conf and replace placeholder with real IP
sudo cp nginx.conf /etc/nginx/sites-available/myapp
sudo sed -i "s/YOUR_EC2_PUBLIC_IP/${EC2_IP}/g" /etc/nginx/sites-available/myapp

# Enable the site, disable default
sudo ln -sf /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp
sudo rm -f /etc/nginx/sites-enabled/default

# Test config before reloading
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
echo "✅ Nginx configured and running"

# ─── STEP 10: Create systemd services ────────────────────────
echo ""
echo "[10/10] Creating systemd services for Gunicorn and Daphne..."

PROJECT_DIR="/home/ubuntu/my-event-project"

# ── Gunicorn service (Django HTTP API) ──
sudo tee /etc/systemd/system/gunicorn.service > /dev/null << EOF
[Unit]
Description=Gunicorn — Django HTTP server
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=${PROJECT_DIR}/backend
EnvironmentFile=${PROJECT_DIR}/backend/.env
ExecStart=${PROJECT_DIR}/venv/bin/gunicorn -c ${PROJECT_DIR}/backend/gunicorn.conf.py config.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ── Daphne service (Django Channels / WebSockets) ──
sudo tee /etc/systemd/system/daphne.service > /dev/null << EOF
[Unit]
Description=Daphne — Django WebSocket server
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=${PROJECT_DIR}/backend
EnvironmentFile=${PROJECT_DIR}/backend/.env
ExecStart=${PROJECT_DIR}/venv/bin/daphne -b 127.0.0.1 -p 8001 config.asgi:application
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start both services
sudo systemctl daemon-reload
sudo systemctl enable gunicorn daphne
sudo systemctl start gunicorn daphne

echo "✅ Gunicorn and Daphne services created and started"

# ─── Create log directories ───────────────────────────────────
sudo mkdir -p /var/log/gunicorn
sudo chown ubuntu:ubuntu /var/log/gunicorn

# ─── Final status check ──────────────────────────────────────
echo ""
echo "======================================================"
echo " ✅ Setup Complete! Checking service status..."
echo "======================================================"
sudo systemctl status gunicorn --no-pager | head -5
sudo systemctl status daphne   --no-pager | head -5
sudo systemctl status nginx    --no-pager | head -5
sudo systemctl status redis    --no-pager | head -5
sudo systemctl status mysql    --no-pager | head -5

echo ""
echo "======================================================"
echo " 🚀 Your app should now be live at:"
echo "    http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "======================================================"
echo ""
echo "Useful commands:"
echo "  sudo systemctl restart gunicorn   # restart backend"
echo "  sudo systemctl restart daphne     # restart websockets"
echo "  sudo systemctl restart nginx      # restart nginx"
echo "  sudo journalctl -u gunicorn -f    # tail gunicorn logs"
echo "  sudo journalctl -u daphne -f      # tail daphne logs"
echo "  sudo nginx -t                     # test nginx config"
