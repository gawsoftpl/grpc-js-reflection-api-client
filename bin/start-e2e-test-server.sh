#!/usr/bin/env sh

npm run test:start-node-server &
./tests/e2e/grpc-go-server-reflection/grpc-reflection-server &