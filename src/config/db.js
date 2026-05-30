const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testConnection = async () => {
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
};

module.exports = {
  initializeDatabase,
  pool,
  testConnection,
};
