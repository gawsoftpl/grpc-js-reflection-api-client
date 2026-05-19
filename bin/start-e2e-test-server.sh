#!/usr/bin/env bash

PIDS=()

cleanup() {
    echo -e "\n[INFO] Stopping all background servers..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
        fi
    done
    # Reset terminal settings just in case
    stty sane 2>/dev/null
    exit 0
}

# Trap Ctrl+C (INT), TERM, and normal EXIT
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

echo "--------------------------------------------------------"
echo " Servers are running! "
echo " Press [Ctrl+C] or [Ctrl+X] to stop them and exit."
echo "--------------------------------------------------------"

# Loop to monitor keystrokes
while true; do
    # Set terminal to read 1 character at a time (raw mode)
    stty -icanon -echo
    char=$(dd bs=1 count=1 2>/dev/null)

    # Check for Ctrl+X (hex value \x18, or ASCII 24)
    if [ "$char" = $'\x18' ]; then
        echo -e "\n[INFO] Ctrl+X detected."
        break
    fi
done

# When the loop breaks (Ctrl+X), cleanup will naturally trigger via EXIT trap