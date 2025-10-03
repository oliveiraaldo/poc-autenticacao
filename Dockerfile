FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm install

# Copiar o resto
COPY . .

# Expor porta
EXPOSE 3000

# Usar o comando do docker-compose
CMD ["npm", "run", "dev"]