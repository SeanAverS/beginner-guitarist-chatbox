FROM node:18-slim 

RUN apt-get update && \
    apt-get install -y python3 python3-pip libopenblas-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY backend/ backend/

WORKDIR /usr/src/app/backend
RUN pip3 install --break-system-packages --no-cache-dir -r requirements.txt

WORKDIR /usr/src/app/backend

CMD ["node", "server.js"]