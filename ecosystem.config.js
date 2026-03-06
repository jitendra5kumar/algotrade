module.exports = {
  apps: [
    {
      name: 'algotrade-backend',
      script: 'dist/server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      
      // Log settings
      error_file: './logs/pm2-backend-error.log',
      out_file: './logs/pm2-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Node arguments for .env loading
      node_args: '-r dotenv/config'
    }
  ]
};