/** PM2 — 카페24 비즈니스(2GB RAM) 메모리 최적화 */
module.exports = {
  apps: [
    {
      name: 'crypto-api',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '350M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'crypto-web',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
