module.exports = {
  apps: [
    {
      name: 'intel24-console',
      script: 'server/index.ts',
      interpreter: 'node_modules/.bin/tsx',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // SSO_JWT_SECRET should be set via environment or .env file - DO NOT commit actual secret
        // SSO_JWT_SECRET: process.env.SSO_JWT_SECRET,
      },
      max_restarts: 5,
      restart_delay: 2000,
    },
  ],
};
