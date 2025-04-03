# Use a lightweight Node.js image with Debian-based Linux
FROM node:18-slim

# Install system dependencies for Chrome
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends

# Set working directory
WORKDIR /app

# Copy project files to container
COPY . .

# Install dependencies
RUN npm install

# Expose a port (only needed if your app serves something)
EXPOSE 3000

# Command to start the app
CMD ["node", "index.js"]
