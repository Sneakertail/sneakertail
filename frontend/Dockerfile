FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
ARG REACT_APP_AUTH_API
ARG REACT_APP_PRODUCT_API
ARG REACT_APP_RAFFLE_API
ARG REACT_APP_INTERACTION_API
ARG REACT_APP_PAYMENT_API

ENV REACT_APP_AUTH_API=${REACT_APP_AUTH_API}
ENV REACT_APP_PRODUCT_API=${REACT_APP_PRODUCT_API}
ENV REACT_APP_RAFFLE_API=${REACT_APP_RAFFLE_API}
ENV REACT_APP_INTERACTION_API=${REACT_APP_INTERACTION_API}
ENV REACT_APP_PAYMENT_API=${REACT_APP_PAYMENT_API}

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
