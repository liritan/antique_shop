FROM python:3.12-slim

WORKDIR /app

# для psycopg2-binary обычно ок и без build deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000