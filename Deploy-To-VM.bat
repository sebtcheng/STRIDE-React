@echo off
echo ==================================================
echo         STRIDE VM Deployment Automator
echo ==================================================
echo.
echo Connecting to VM at 20.24.58.49...
echo Please enter the password when prompted (7v52E69TYgTE)
echo.

ssh Administrator1@20.24.58.49 "echo --- Starting Deployment --- && cd /srv/shiny-server/app1/STRIDE-React && git pull && npm install && npm run build && pm2 delete stride-app 2>/dev/null || true && pm2 start 'npm start -- -p 3002' --name 'stride-app' -w /srv/shiny-server/app1/STRIDE-React && pm2 save && echo --- Deployment Successful ---"

echo.
echo ==================================================
echo Deployment process finished.
echo If you saw 'Deployment Successful', everything worked!
echo ==================================================
pause
