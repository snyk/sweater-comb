FROM node:25.2.1-alpine3.21 AS build-env
WORKDIR /sweater-comb
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
COPY . .
RUN npm run build

FROM node:25.2.1-alpine3.21 AS clean-env
COPY --from=build-env /sweater-comb/build/ /sweater-comb/
COPY --from=build-env /sweater-comb/babel.config.js /sweater-comb/
COPY --from=build-env /sweater-comb/package*.json /sweater-comb/
WORKDIR /sweater-comb
RUN npm install --production

FROM node:25.2.1-alpine3.21
ENV NODE_ENV production
COPY --from=clean-env /sweater-comb/ /sweater-comb/
WORKDIR /sweater-comb
USER 1000
ENTRYPOINT ["/usr/local/bin/node", "index.js"]
