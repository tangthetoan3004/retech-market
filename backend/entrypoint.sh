#!/bin/bash
set -e

echo "Waiting for MySQL..."
python << 'WAIT_MYSQL'
import time, os
while True:
    try:
        import MySQLdb
        MySQLdb.connect(
            host=os.environ.get('DB_HOST', 'mysql'),
            port=int(os.environ.get('DB_PORT', '3306')),
            user=os.environ.get('DB_USER', 'root'),
            passwd=os.environ.get('DB_PASSWORD', ''),
        )
        break
    except Exception:
        time.sleep(1)
WAIT_MYSQL
echo "MySQL is ready!"

echo "Waiting for Redis..."
python << 'WAIT_REDIS'
import time, os
while True:
    try:
        import redis
        r = redis.Redis.from_url(os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/1'))
        r.ping()
        break
    except Exception:
        time.sleep(1)
WAIT_REDIS
echo "Redis is ready!"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Celery Worker (background)..."
celery -A config worker -l info &

echo "Starting Celery Beat (background)..."
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler &

echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000
