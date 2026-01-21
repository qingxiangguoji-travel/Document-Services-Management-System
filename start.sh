#!/bin/sh

echo "==> Bootstrapping Laravel..."

# 确保 .env 存在
if [ ! -f .env ]; then
  echo "Creating .env file..."
  touch .env
fi

# 写入环境变量到 .env
echo "APP_ENV=${APP_ENV}" > .env
echo "APP_DEBUG=${APP_DEBUG}" >> .env
echo "APP_KEY=${APP_KEY}" >> .env
echo "APP_URL=${APP_URL}" >> .env

# 设置权限
echo "Fixing permissions..."
chmod -R 775 storage bootstrap/cache || true
chown -R www-data:www-data storage bootstrap/cache || true

# 清理缓存
echo "Clearing caches..."
php artisan key:clear || true
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "Starting PHP-FPM..."
php-fpm -D

echo "Starting Nginx..."
nginx -g "daemon off;"
