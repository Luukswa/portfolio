module.exports = {
  apps: [
    {
      name: 'portfolio',
      cwd: './backend',
      script: 'python',
      args: '-m waitress --host=127.0.0.1 --port=5000 --threads=16 app:app',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      env: {
        FLASK_ENV: 'production',
      },
    },
  ],
}
