# ============================================================
# ALhafez Center - Backend + AI Dockerfile
# ============================================================
# Multi-stage build: dependencies first, then app copy
# ============================================================

# ---------- Stage 1: Python dependencies ----------
FROM python:3.11-slim AS builder

WORKDIR /build

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for layer caching
COPY backend/requirements.txt ./requirements.txt

# Install Python dependencies into a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install requirements
RUN pip install --no-cache-dir -r requirements.txt


# ---------- Stage 2: Runtime image ----------
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install runtime system dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# PYTHONPATH includes both:
#  - /app          → so `from ai.chatbot_ai ...` works (ai/ is at /app/ai/)
#  - /app/backend  → so `from app.auth ...` works (app/ is at /app/backend/app/)
ENV PYTHONPATH="/app:/app/backend"

# Copy backend code
COPY backend/ /app/backend/

# Copy AI module
COPY ai/ /app/ai/

# Create directories for persistent data
RUN mkdir -p /app/backend/uploads \
    && mkdir -p /app/backend/logs \
    && mkdir -p /app/ai/chroma_db_v2 \
    && mkdir -p /app/ai/knowledge_base

# Expose the backend port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run uvicorn from /app/backend so relative paths in config.py resolve correctly
# main.py uses `from app.auth ...` → needs /app/backend in PYTHONPATH
# chatbot_ai.py uses `from backend.app.auth ...` → needs /app in PYTHONPATH
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
