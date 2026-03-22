const { createTables } = require('./db');

console.log('Running database migrations...');
createTables()
  .then(() => {
    console.log('Database migrations completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database migrations failed:', err);
    process.exit(1);
  });
