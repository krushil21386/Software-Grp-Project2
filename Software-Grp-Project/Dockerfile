# Use Node.js 22 alpine (LTS)
FROM docker.io/library/node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with increased timeout and retries for network resilience
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --network-timeout=100000

# Copy the rest of the frontend code
COPY . .

# Expose the Vite port
EXPOSE 5173

# Start Vite with --host to allow external access within the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
