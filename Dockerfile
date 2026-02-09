FROM php:8.2-fpm

# 强制 Render 丢弃缓存，重新编译镜像
ARG CACHEBUST=1

# 安装系统依赖 + PostgreSQL 编译依赖
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    nodejs \
    npm \
    nginx \
    supervisor \
    libpq-dev \
    && docker-php-ext-install \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd

# 安装 Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 设置工作目录
WORKDIR /var/www

# 复制项目文件
COPY . .

# 安装 PHP 依赖
RUN composer install --no-dev --optimize-autoloader
RUN php artisan config:clear \
 && php artisan route:clear \
 && php artisan view:clear


# 构建前端
RUN npm install && npm run build

# Nginx 配置
COPY nginx.conf /etc/nginx/sites-available/default

# 启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Laravel 运行权限
RUN mkdir -p storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

EXPOSE 10000
CMD ["/start.sh"]
