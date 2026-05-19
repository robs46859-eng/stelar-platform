# Ollama Systemd Configuration for Custom Model Storage

When Ollama runs as a systemd service (default on Ubuntu installs), the `OLLAMA_MODELS` env var set in `~/.bashrc` is **NOT** picked up by the service. The service runs as the `ollama` user, not your login shell.

## Problem

After setting `OLLAMA_MODELS=/mnt/disk/ollama` in `~/.bashrc`, `ollama pull` from the CLI works, but the **serve** process still writes to the default path (`/usr/share/ollama/.ollama/models/`), which is usually on the small OS disk. This causes "no space left on device" errors when pulling large models.

## Fix: Inject env var into the systemd unit

```bash
# 1. Stop the service
sudo systemctl stop ollama

# 2. Add OLLAMA_MODELS to the [Service] block of the unit file
sudo sed -i '/^\[Service\]/a Environment="OLLAMA_MODELS=/mnt/disk/ollama"' /etc/systemd/system/ollama.service

# 3. Ensure the target directory exists and is owned by the ollama user
sudo mkdir -p /mnt/disk/ollama
sudo chown -R ollama:ollama /mnt/disk/ollama

# 4. Reload systemd and restart
sudo systemctl daemon-reload
sudo systemctl start ollama

# 5. Verify it's running and using the right path
sudo systemctl status ollama
```

## Verify the env var is active

```bash
# Check the service's environment
sudo systemctl show ollama --property=Environment
```

## Pull the model

```bash
ollama pull gemma4:26b
```

## Notes

- The unit file is at `/etc/systemd/system/ollama.service` on standard Ubuntu installs.
- If you also want to set the `OLLAMA_HOST` or other Ollama env vars, add additional `Environment=` lines in the same `[Service]` block.
- The `ollama` user must have read/write access to the target directory. Use `chown -R ollama:ollama <path>`.
- After changing the unit file, you **must** run `daemon-reload` before `restart` or the old config is still used.
