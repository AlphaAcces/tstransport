module.exports = {
  apps: [
    {
      name: 'ts24-intel-console',
      script: 'server/index.ts',
      interpreter: 'node_modules/.bin/tsx',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_restarts: 5,
      restart_delay: 2000,
    },
  ],
};
