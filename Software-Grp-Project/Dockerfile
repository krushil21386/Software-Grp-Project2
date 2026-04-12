# Use Node.js 18 alpine (cached)
FROM docker.io/library/node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the Vite port
EXPOSE 5173

# Start Vite with --host to allow external access within the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
