FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node src ./src

EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT,path:'/health'},response=>process.exit(response.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/app.js"]
