#!/usr/bin/env sh

npm run test:start-node-server &
npm run test:start-node-server2 &
./tests/e2e/grpc-go-server-reflection/grpc-reflection-server &
sleep 4