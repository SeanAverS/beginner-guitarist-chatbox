FROM node:18-slim 

RUN apt-get update && \
    apt-get install -y python3 python3-pip libopenblas-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/backend

COPY backend/package*.json .
RUN npm install

COPY backend/requirements.txt .
RUN pip3 install --break-system-packages --no-cache-dir -r requirements.txt

COPY backend/ .

CMD ["node", "server.js"]