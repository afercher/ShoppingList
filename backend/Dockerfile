FROM php:8.2-cli-alpine

# Install required system dependencies
RUN apk add --no-cache \
    postgresql-dev

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql opcache

# Improve local API latency when using the PHP built-in server.
RUN printf "%s\n" \
    "opcache.enable=1" \
    "opcache.enable_cli=1" \
    "opcache.memory_consumption=128" \
    "opcache.interned_strings_buffer=8" \
    "opcache.max_accelerated_files=10000" \
    "opcache.revalidate_freq=2" \
    "opcache.validate_timestamps=1" \
    > /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /app

COPY . /app

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]




