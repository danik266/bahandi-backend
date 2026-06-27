module.exports = {
  apps: [
    {
      name: 'bahandi-api',
      script: 'npm',
      args: 'start',
      cwd: '/opt/bahandi-api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
        API_HOST: '0.0.0.0',
        API_PORT: '4000',
        PUBLIC_BASE_URL: 'http://46.101.134.38:4000',
        CORS_ORIGIN: '*',
        SERVE_WEB: 'false',
      },
      error_file: '/opt/bahandi-api/logs/error.log',
      out_file: '/opt/bahandi-api/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
