FROM node:18

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el esquema de Prisma y generar el cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
