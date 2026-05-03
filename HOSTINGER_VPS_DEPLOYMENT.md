# Hostinger VPS Deployment Guide

This project is prepared to run the Laravel application directly on the VPS with `nginx` + `php-fpm`, while PostgreSQL runs in Docker via [compose.yaml](compose.yaml).

## 1. Server prerequisites

Install the runtime packages you still need if they are not already present:

```bash
sudo apt update
sudo apt install -y php8.4 php8.4-cli php8.4-fpm php8.4-pgsql php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip php8.4-bcmath php8.4-intl unzip git supervisor
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Install Composer if needed:

```bash
cd /tmp
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
sudo mv composer.phar /usr/local/bin/composer
```

## 2. Clone and configure the app

```bash
cd /var/www
sudo git clone <your-repository-url> callme-wheel
sudo chown -R $USER:$USER /var/www/callme-wheel
cd /var/www/callme-wheel
cp .env.example .env
php artisan key:generate
```

Set production values in `.env`:

```dotenv
APP_NAME="Callme - Rewards Wheel"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.example

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=callme_wheel
DB_USERNAME=callme
DB_PASSWORD=change-me

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_SECURE_COOKIE=true

INERTIA_SSR_ENABLED=false

ADMIN_EMAIL=admin@callme.wheels
ADMIN_PASSWORD=Callme123456!
```

`INERTIA_SSR_ENABLED=false` is intentional here because this repo does not currently ship an SSR runtime entrypoint.

## 3. Start PostgreSQL in Docker

Export the Docker variables once or place them in a shell env file before starting compose:

```bash
export POSTGRES_DB=callme_wheel
export POSTGRES_USER=callme
export POSTGRES_PASSWORD='change-me'
docker compose up -d
docker compose ps
```

The database is published only on `127.0.0.1:5432`, so it is reachable from the VPS itself but not exposed publicly.

## 4. Install app dependencies and build assets

```bash
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan storage:link
php artisan migrate --force
php artisan db:seed --class=AdminUserSeeder --force
php artisan optimize
```

If a stale `public/hot` file exists from local Vite development, remove it before serving production traffic:

```bash
rm -f public/hot
```

## 5. nginx site configuration

Create an nginx site pointing to Laravel `public/`:

```nginx
server {
    server_name your-domain.example;
    root /var/www/callme-wheel/public;
    index index.php;

    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable the site and reload nginx:

```bash
sudo ln -s /etc/nginx/sites-available/callme-wheel /etc/nginx/sites-enabled/callme-wheel
sudo nginx -t
sudo systemctl reload nginx
```

If Certbot already issued the certificate, re-run the nginx installer step so the TLS block is attached to this site:

```bash
sudo certbot --nginx -d your-domain.example
```

## 6. Queue worker with Supervisor

Create `/etc/supervisor/conf.d/callme-wheel-worker.conf`:

```ini
[program:callme-wheel-worker]
process_name=%(program_name)s_%(process_num)02d
command=/usr/bin/php /var/www/callme-wheel/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/callme-wheel/storage/logs/worker.log
directory=/var/www/callme-wheel
```

Apply it:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start callme-wheel-worker:*
```

## 7. Ongoing deploy sequence

For each deploy:

```bash
cd /var/www/callme-wheel
git pull origin main
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan migrate --force
php artisan optimize
php artisan queue:restart
sudo systemctl reload php8.4-fpm
sudo systemctl reload nginx
```

## 8. Admin bootstrap user

The project now seeds a deterministic bootstrap admin account through `AdminUserSeeder`.

- Email: `admin@callme.wheels`
- Password: `Callme123456!`

Rotate the password immediately after first production login if you do not override `ADMIN_PASSWORD` in `.env`.