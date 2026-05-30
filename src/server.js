require('dotenv').config();

const app = require('./app');
const { initializeDatabase, testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    await initializeDatabase();
    console.log('MySQL connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MySQL:', error.message);
    process.exit(1);
  }
};

startServer();
