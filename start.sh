#!/bin/sh

echo "==> Preparing Laravel runtime..."

# 确保日志目录存在
mkdir -p storage/logs

# 权限兜底
chmod -R 775 storage bootstrap/cache || true
chown -R www-data:www-data storage bootstrap/cache || true

echo "==> Clearing cached config..."
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "==> Forcing DB connection to refresh..."
php artisan migrate --force || true

echo "==> Starting PHP-FPM..."
php-fpm -D

echo "==> Starting Nginx..."
nginx -g "daemon off;"
