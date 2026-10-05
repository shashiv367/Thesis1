FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for psycopg2 and compiling PyTorch
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

EXPOSE 8000

# Start Gunicorn server (production ready)
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
