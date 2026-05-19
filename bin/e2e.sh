#!/usr/bin/env bash

PIDS=()

cleanup() {
    # Capture the exit code of the last executed command BEFORE cleanup runs
    local exit_code=$?

    echo -e "\n[INFO] Stopping all background servers..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
        fi
    done

    stty sane 2>/dev/null

    # Explicitly exit with the tests' original exit code
    exit $exit_code
}

# Trap INT, TERM, and EXIT to run the cleanup
trap cleanup INT TERM EXIT

# 1. Start Server 1
npm run test:start-node-server &
PIDS+=($!)

# 2. Start Server 2
npm run test:start-node-server2 &
PIDS+=($!)

# 3. Start Go Server
./tests/e2e/grpc-go-server-reflection/grpc-reflection-server &
PIDS+=($!)

echo "[INFO] All servers started with PIDs: ${PIDS[*]}"
echo "[INFO] Waiting 4 seconds for initialization..."
sleep 4

echo "[INFO] Starting E2E Tests..."
# 4. Run your tests in the FOREGROUND so the script waits for them
npm run test:e2e