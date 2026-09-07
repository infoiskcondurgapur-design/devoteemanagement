# Devotee Management System - WhatsApp Bot / API server container
# Runs the Express API + SQLite + WhatsApp bot (whatsapp-web.js / Puppeteer)
FROM node:20-bookworm-slim

# Chromium + libraries required by Puppeteer/whatsapp-web.js
# (--no-sandbox is passed by the app, so no need for extra setuid sandbox support)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Persistent data is expected to live on a mounted volume at /data
# (SQLite DB + WhatsApp LocalAuth sessions must survive container restarts)
ENV DB_PATH=/data/devotee_mgmt.db \
    HOST=0.0.0.0 \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production

EXPOSE 3001

# chromium needs a bunch of writeable temp locations; give the default user one
ENV CHROME_USER_DATA_DIR=/tmp/chrome

CMD ["node", "server.mjs"]
