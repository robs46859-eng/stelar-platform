# Dashboard Web UI — Access & Exposure

## Problem

The Hermes dashboard binds to `127.0.0.1:9119` by default. This means:
- The dashboard is **only reachable from the same machine** (localhost).
- You **cannot** browse to it from another device on the network.
- You **cannot** access it via a domain name (e.g., `worklifelm.com`).
- The built-in CORS policy (`allow_origin_regex` in `web_server.py`) only allows
  `localhost` and `127.0.0.1` — requests from other hostnames are rejected.

## Safe method: Reverse proxy (recommended)

Keep the dashboard on localhost and add a TLS-terminating reverse proxy.

### 1. Stop any running dashboard

```bash
hermes dashboard --stop
```

### 2. Restart on localhost (no changes needed)

```bash
hermes dashboard --no-open
```

### 3. Add a reverse proxy (nginx example)

```nginx
server {
    listen 80;
    server_name worklifelm.com;

    location / {
        proxy_pass http://127.0.0.1:9119;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4. Patch CORS in `web_server.py`

The dashboard validates the `Host` header against the bound interface. When accessed
through a proxy, the `Host` header will be `worklifelm.com`, not `127.0.0.1`. You must
update `allow_origin_regex` to include your domain.

Find and edit in `~/.hermes/hermes-agent/hermes_cli/web_server.py`:

```python
# BEFORE (line ~104):
allow_origin_regex=r"^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?$"

# AFTER:
allow_origin_regex=r"^https?://(localhost|127\\.0\\.0\\.1|worklifelm\\.com)(:\\d+)?$"
```

### 5. Get a TLS certificate

Use Let's Encrypt / certbot:

```bash
sudo certbot --nginx -d worklifelm.com
```

Then reload nginx. Your dashboard is now available at `https://worklifelm.com`.

## Dangerous method: Direct --insecure binding

**Only use on trusted, private networks.** This exposes API keys and config to
anyone who can reach the port.

```bash
hermes dashboard --stop
hermes dashboard --host 0.0.0.0 --insecure --port 9119 --no-open
```

You must still patch `allow_origin_regex` (see Step 4 above) for browser CORS to work.

A firewall or VPN is **strongly** recommended.

## Quick method: SSH tunnel

No config changes needed. Tunnel from your local machine:

```bash
ssh -L 9119:127.0.0.1:9119 youruser@worklifelm.com
```

Then open `http://127.0.0.1:9119` in your browser.

## Key code locations

| What | Where |
|------|-------|
| Server startup (`start_server`) | `hermes_cli/web_server.py` around line 4401 |
| CORS policy (`allow_origin_regex`) | `hermes_cli/web_server.py` around line 104 |
| Host header validation (`host_header_middleware`) | `hermes_cli/web_server.py` around line 206 |
| CLI args (`--host`, `--insecure`) | `hermes_cli/main.py` around line 11605 |
| Session token auth | `hermes_cli/web_server.py` around line 125 |