# 🔧 Logging System - Quick Reference

## From now on, instead of screenshots, just run:

```bash
cd /media/swastik/focus/projects\ 2026/chat\ app/0.0/mobile

# Capture 30 seconds of logs
./scripts/capture-logs.sh 30

# Share the log file path with me
# File saved at: logs/app-logs-TIMESTAMP.txt
```

## Auto-Logging is Now Active!

The app now automatically writes logs to:
- **Device**: `/storage/emulated/0/Android/data/com.helloworld/files/logs/`
- **Computer** (when you run capture script): `mobile/logs/`

Every action, error, crash, and warning is logged with:
- Precise timestamps
- Error details
- Full crash stack traces

## Quick Commands

```bash
# View live logs
./scripts/view-logs.sh

# Capture specific duration
./scripts/capture-logs.sh 60  # 60 seconds

# Pull device logs to computer  
./scripts/pull-device-logs.sh

# Find errors in logs
cat logs/app-logs-*.txt | grep ERROR
```

See [LOGGING.md](./LOGGING.md) for full guide.
