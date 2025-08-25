module.exports = {
  apps: [{
    name: 'paradise-bakes-cafe',
    script: 'server.js',
    cwd: '/opt/paradise-bakes-cafe',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/opt/logs/pm2-error.log',
    out_file: '/opt/logs/pm2-out.log',
    log_file: '/opt/logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
    shutdown_with_message: true
  }]
};
