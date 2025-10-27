FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
# Using HTTP wrapper for Railway deployment
CMD ["node", "http-wrapper.js"]
