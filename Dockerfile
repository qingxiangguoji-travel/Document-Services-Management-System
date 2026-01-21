# 基础镜像
FROM php:8.2-fpm

# 安装系统依赖
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
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# 安装 Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 设置工作目录
WORKDIR /var/www

# 复制项目文件
COPY . .

# 安装 PHP 依赖
RUN composer install --no-dev --optimize-autoloader

# 安装前端依赖并构建
RUN npm install && npm run build

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/sites-available/default

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 修复权限
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 10000

CMD ["/start.sh"]
