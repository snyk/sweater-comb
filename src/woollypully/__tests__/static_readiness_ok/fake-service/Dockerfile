FROM node:14-alpine AS build-env
WORKDIR /fake-service
COPY . .
RUN npm install
EXPOSE 8080
ENTRYPOINT [ "node", "index.js" ]
