#!/bin/bash
# Serve Machine Grid on your network so other devices can reach it.
# Usage: ./serve.sh   (or: bash serve.sh)

cd "$(dirname "$0")"
PORT=8080

# If something is already on 8080, try to use 8765 instead
if lsof -i :$PORT >/dev/null 2>&1; then
  echo "Port $PORT is in use. Stop the other server first (see README-NETWORK.md) or we'll use 8765."
  PORT=8765
fi

echo "Starting server on port $PORT (reachable from this machine and others on your network)..."
echo ""
# Use server.py for shared data across all devices; bind to 0.0.0.0 for network access
PORT=$PORT python3 server.py &
SERVER_PID=$!
sleep 1

# Get your Mac's IP on the local network
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -z "$IP" ]; then
  IP="YOUR_MAC_IP"
fi

echo "-------------------------------------------"
echo "  On this Mac:     http://localhost:$PORT"
echo "  On other devices: http://$IP:$PORT"
echo "-------------------------------------------"
echo ""
echo "If others still can't connect:"
echo "  1. System Settings > Network > Firewall > Options"
echo "  2. Click + and add Python: $(which python3)"
echo "  3. Set it to 'Allow incoming connections'"
echo ""
echo "Press Ctrl+C to stop the server."
wait $SERVER_PID
