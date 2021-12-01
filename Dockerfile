FROM node:14-alpine AS build
ENV NODE_ENV=development
WORKDIR /usr/src/sweater-comb
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install
COPY . .
RUN yarn build

FROM node:14-alpine AS clean
WORKDIR /usr/src/sweater-comb
COPY --from=build /usr/src/sweater-comb/package*.json ./
COPY --from=build /usr/src/sweater-comb/build ./
RUN npm install --only=production

FROM gcr.io/distroless/nodejs:14
WORKDIR /usr/lib/sweater-comb
COPY --from=clean /usr/src/sweater-comb ./
USER 1000
CMD ["index.js"]
