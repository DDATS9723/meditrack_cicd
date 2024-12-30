# Use the official Node.js image as a base (updated to a more recent version)
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Copy the rest of the application code
COPY . .

# Expose the application port (adjust based on your app's configuration)
EXPOSE 3000

# Command to start the application
CMD ["node", "app.js"]
