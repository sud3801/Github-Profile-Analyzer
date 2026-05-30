require('dotenv').config();

const app = require('./app');
const { dbConfig, initializeDatabase, testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

const getSafeDatabaseSummary = () => {
  if (typeof dbConfig === 'string') {
    return {
      mode: 'url',
      hasDatabaseUrl: true,
    };
  }

  return {
    mode: 'fields',
    host: dbConfig.host || null,
    port: dbConfig.port || null,
    userSet: Boolean(dbConfig.user),
    passwordSet: Boolean(dbConfig.password),
    database: dbConfig.database || null,
  };
};

const startServer = async () => {
  try {
    await testConnection();
    await initializeDatabase();
    console.log('MySQL connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MySQL');
    console.error('Database config:', getSafeDatabaseSummary());
    console.error('Error details:', {
      message: error.message || null,
      code: error.code || null,
      errno: error.errno || null,
      sqlState: error.sqlState || null,
    });
    process.exit(1);
  }
};

startServer();
