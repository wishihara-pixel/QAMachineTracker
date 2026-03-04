#!/usr/bin/env python3
"""
Serves the Machine Grid app and a shared data file so all devices see the same data.
Run: python3 server.py
Then open http://localhost:8080 (or http://YOUR_IP:8080 from other devices).
"""
import json
import os
import socket
import subprocess
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", "8080"))
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")


def read_data():
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"machines": [], "stickies": []}


def write_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/data" or self.path == "/api/data/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(read_data()).encode())
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/data" or self.path == "/api/data/":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length)
                data = json.loads(body.decode())
                if "machines" in data and "stickies" in data:
                    write_data({"machines": data["machines"], "stickies": data["stickies"]})
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps(read_data()).encode())
                else:
                    self.send_error(400, "Bad request: need machines and stickies")
            except Exception as e:
                self.send_error(400, str(e))
            return
        return super().do_POST()


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        pass
    for iface in ("en0", "en1"):
        try:
            out = subprocess.check_output(
                ["ipconfig", "getifaddr", iface], text=True, stderr=subprocess.DEVNULL
            )
            return out.strip() or None
        except Exception:
            continue
    return None


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print("Machine Grid server")
    print("  On this Mac:     http://localhost:{}".format(PORT))
    ip = get_local_ip()
    if ip:
        print("  For coworkers:  http://{}:{}".format(ip, PORT))
    else:
        print("  For coworkers:  http://YOUR_IP:{}  (run: ipconfig getifaddr en0)".format(PORT))
    print("  Data file:      {}".format(DATA_FILE))
    server.serve_forever()
