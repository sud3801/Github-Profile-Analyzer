const mysql = require('mysql2/promise');

const getEnv = (...keys) => {
  return keys.map((key) => process.env[key]).find(Boolean);
};

const databaseUrl = getEnv('DATABASE_URL', 'MYSQL_URL');

const dbConfig = databaseUrl
  ? databaseUrl
  : {
      host: getEnv('DB_HOST', 'MYSQLHOST', 'MYSQL_HOST'),
      port: Number(getEnv('DB_PORT', 'MYSQLPORT', 'MYSQL_PORT') || 3306),
      user: getEnv('DB_USER', 'MYSQLUSER', 'MYSQL_USER'),
      password: getEnv('DB_PASSWORD', 'MYSQLPASSWORD', 'MYSQL_ROOT_PASSWORD'),
      database: getEnv('DB_NAME', 'MYSQLDATABASE', 'MYSQL_DATABASE'),
    };

const pool = mysql.createPool({
  ...(typeof dbConfig === 'string' ? { uri: dbConfig } : dbConfig),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const validateDatabaseConfig = () => {
  if (typeof dbConfig === 'string') {
    return;
  }

  const missingKeys = Object.entries(dbConfig)
    .filter(([key, value]) => key !== 'port' && !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing database configuration: ${missingKeys.join(', ')}`);
  }
};

const testConnection = async () => {
  validateDatabaseConfig();
  const connection = await pool.getConnection();
  connection.release();
};

const initializeDatabase = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS github_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255),
      bio TEXT,
      location VARCHAR(255),
      company VARCHAR(255),
      blog VARCHAR(255),
      avatar_url TEXT,
      github_url TEXT,
      public_repos INT DEFAULT 0,
      followers INT DEFAULT 0,
      following INT DEFAULT 0,
      total_stars INT DEFAULT 0,
      total_forks INT DEFAULT 0,
      top_languages JSON,
      developer_score INT DEFAULT 0,
      profile_summary TEXT,
      profile_badges JSON,
      most_starred_repo VARCHAR(255),
      latest_repo VARCHAR(255),
      average_stars_per_repo DECIMAL(10,2) DEFAULT 0,
      has_profile_readme BOOLEAN DEFAULT FALSE,
      account_created_at DATETIME,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn('developer_score', 'developer_score INT DEFAULT 0');
  await ensureColumn('profile_summary', 'profile_summary TEXT');
  await ensureColumn('profile_badges', 'profile_badges JSON');
};

const ensureColumn = async (columnName, columnDefinition) => {
  const [rows] = await pool.execute(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'github_profiles'
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [columnName]
  );

  if (rows.length === 0) {
    await pool.execute(`ALTER TABLE github_profiles ADD COLUMN ${columnDefinition}`);
  }
};

module.exports = {
  dbConfig,
  initializeDatabase,
  pool,
  testConnection,
};
