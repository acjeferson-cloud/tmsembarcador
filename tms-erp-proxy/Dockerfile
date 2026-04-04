# Utilizar a imagem Alpine do Node.js 20 para ter footprint pequeno
FROM node:20-alpine

# Definir o diretório de trabalho no container
WORKDIR /app

# Copiar apenas os arquivos de pacote para aproveitar o cache do Docker
COPY package*.json ./

# Instalar as dependências de produção
RUN npm install --production

# Copiar todo o código fonte
COPY . ./

# O Google Cloud Run, por padrão, ouve na porta 8080
ENV PORT=8080
EXPOSE 8080

# Iniciar a aplicação
CMD ["npm", "start"]
