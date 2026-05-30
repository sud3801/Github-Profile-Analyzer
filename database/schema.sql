CREATE DATABASE IF NOT EXISTS github_profile_analyzer;

USE github_profile_analyzer;

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
);
