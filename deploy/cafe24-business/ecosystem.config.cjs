const path = require('path');

const root = path.resolve(__dirname, '../..');

/** PM2 — 카페24 비즈니스(2GB RAM) 메모리 최적화 */
module.exports = {
  apps: [
    {
      name: 'crypto-api',
      cwd: path.join(root, 'backend'),
      script: path.join(root, 'backend/dist/index.js'),
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '350M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: path.join(root, 'logs/api-error.log'),
      out_file: path.join(root, 'logs/api-out.log'),
    },
    {
      name: 'crypto-web',
      cwd: path.join(root, 'frontend'),
      script: path.join(root, 'frontend/node_modules/next/dist/bin/next'),
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: path.join(root, 'logs/web-error.log'),
      out_file: path.join(root, 'logs/web-out.log'),
    },
  ],
};
