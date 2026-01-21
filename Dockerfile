FROM php:8.2-fpm

# ===============================
# 系统依赖 + PHP 扩展依赖
# ===============================
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    nodejs \
    npm \
    nginx \
    supervisor \
    && docker-php-ext-install \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ===============================
# Composer
# ===============================
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ===============================
# 工作目录
# ===============================
WORKDIR /var/www

# ===============================
# 拷贝代码
# ===============================
COPY . .

# ===============================
# PHP 依赖
# ===============================
RUN composer install --no-dev --optimize-autoloader

# ===============================
# 前端构建
# ===============================
RUN npm install && npm run build

# ===============================
# Nginx 配置
# ===============================
COPY nginx.conf /etc/nginx/sites-available/default

# ===============================
# 启动脚本
# ===============================
COPY start.sh /start.sh
RUN chmod +x /start.sh

# ===============================
# Laravel 权限修复（构建阶段）
# ===============================
RUN mkdir -p storage/logs bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache

# ===============================
# 端口
# ===============================
EXPOSE 10000

CMD ["/start.sh"]
