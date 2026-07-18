FROM python:3.10-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

# Copy application code
COPY . .

# Create uploads/logs dirs and a non-root user to own them
RUN mkdir -p uploads logs \
    && addgroup --system app && adduser --system --ingroup app app \
    && chown -R app:app /app

USER app

# Expose port
EXPOSE 5000

# Container-level health check (curl was installed above specifically for this)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application with a production WSGI server instead of the
# Flask dev server (app.run / debug mode is not safe or performant in prod)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "--timeout", "60", "app:app"]