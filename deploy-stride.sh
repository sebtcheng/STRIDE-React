#!/bin/bash

# ==============================================================================
# STRIDE Deployment Script for Linux VM (Ubuntu/Debian)
# This script automates the installation of Node.js, PM2, and your app.
# ==============================================================================

# 1. Update and install basic dependencies
echo "🚀 Updating system and installing dependencies..."
sudo apt-get update
sudo apt-get install -y curl git build-essential

# 2. Install or Upgrade Node.js 20 (LTS)
echo "📦 Ensuring Node.js 20 is installed..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "✅ Node.js Version: $(node -v)"

# 3. Handle the Repository
APP_DIR="STRIDE-React"
if [ -d "$APP_DIR" ]; then
    echo "📂 Repository exists. Pulling latest changes..."
    cd "$APP_DIR"
    git pull
else
    echo "🌐 Cloning repository..."
    git clone https://github.com/sebtcheng/STRIDE-React.git
    cd "$APP_DIR"
fi

# 4. Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "Please create a .env file with your database credentials before proceeding."
    echo "Example: nano .env"
    # exit 1 # Uncomment if you want to stop if .env is missing
fi

# 5. Clean install if native bindings are broken (Optional but recommended for environment changes)
echo "🧹 Cleaning up old build artifacts..."
rm -rf .next

# 6. Install npm packages and Build
echo "🏗️  Installing npm packages and building the application..."
# If you face "native binding" errors, uncomment the line below:
# rm -rf node_modules package-lock.json && npm install

npm install
npm run build

# 7. Install and Setup PM2
if ! command -v pm2 &> /dev/null
then
    echo "🚀 Installing PM2..."
    sudo npm install -g pm2
fi

# 8. Start/Restart the application with PM2
echo "🔥 Starting application on port 3002..."
pm2 delete stride-app 2>/dev/null || true
pm2 start npm --name "stride-app" -- start -- -p 3002

# Save PM2 state to restart on VM reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

echo "=============================================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "📍 Your app should be running at: http://your-vm-ip-address:3002"
echo "🔍 Check logs with: pm2 logs stride-app"
echo "=============================================================================="
