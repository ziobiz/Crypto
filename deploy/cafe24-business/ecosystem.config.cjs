const path = require('path');

const root = path.resolve(__dirname, '../..');

/** PM2 — 통합 서버 1개 (Express API + Next.js) */
module.exports = {
  apps: [
    {
      name: 'crypto',
      cwd: root,
      script: path.join(root, 'server/dist/index.js'),
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        WEB_PORT: 3000,
      },
      error_file: path.join(root, 'logs/crypto-error.log'),
      out_file: path.join(root, 'logs/crypto-out.log'),
    },
  ],
};
