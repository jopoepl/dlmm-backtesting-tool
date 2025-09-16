# DLMM Analytics Snapshot Collection

Simple setup for automatic pool snapshot collection every hour.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Scheduler

```bash
npm run snapshot
```

That's it! The scheduler will:

- ✅ Run immediately (collect one snapshot)
- ✅ Then run every hour automatically
- ✅ Show logs in real-time
- ✅ Handle errors gracefully

## Commands

- **`npm run snapshot`** - Start the hourly scheduler
- **`npm run snapshot:once`** - Run snapshot collection once and exit

## Stop the Scheduler

Press `Ctrl+C` to stop the scheduler gracefully.

## Schedule Options

To change the schedule, edit `scripts/snapshot-scheduler.js` and modify the cron schedule:

```javascript
// Current: Every hour
const cronSchedule = "0 * * * *";

// Other options:
// Every 30 minutes: '*/30 * * * *'
// Every 15 minutes: '*/15 * * * *'
// Every 5 minutes: '*/5 * * * *'
// Every day at 2 AM: '0 2 * * *'
```

## Running in Background (Production)

To run the scheduler in the background on your VPS:

```bash
# Using nohup (keeps running after terminal closes)
nohup npm run snapshot > snapshot.log 2>&1 &

# Using PM2 (better process management)
npm install -g pm2
pm2 start "npm run snapshot" --name dlmm-snapshots
pm2 save
pm2 startup
```

## Monitoring

Check the logs:

```bash
# If using nohup
tail -f snapshot.log

# If using PM2
pm2 logs dlmm-snapshots
```

## Why Node-cron is Better

✅ **Simpler** - One script, no system configuration  
✅ **Better logging** - All logs in one place  
✅ **Easier debugging** - Run and see output immediately  
✅ **Portable** - Works the same everywhere  
✅ **Error handling** - Built-in error management

vs System cron:
❌ Complex setup  
❌ Hard to debug  
❌ Separate process management  
❌ System-level configuration required
