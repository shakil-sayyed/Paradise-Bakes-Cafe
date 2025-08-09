module.exports = {
  apps: [
    {
      name: "paradise-bakes-backend",
      script: "./backend/dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 4000,
      },
    },
    {
      name: "paradise-bakes-frontend-static",
      script: "serve",
      args: "-s /var/www/pbc/frontend -l 5000",
      env: {
        NODE_ENV: "production",
      },
      autorestart: false,
      watch: false,
    },
  ],
};

