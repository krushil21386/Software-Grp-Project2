# Use Node.js 18 alpine for a lightweight image (cached)
FROM docker.io/library/node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the API port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
