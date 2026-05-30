const { pool } = require('../config/db');

const profileColumns = `
  id,
  username,
  name,
  bio,
  location,
  company,
  blog,
  avatar_url,
  github_url,
  public_repos,
  followers,
  following,
  total_stars,
  total_forks,
  top_languages,
  developer_score,
  profile_summary,
  profile_badges,
  most_starred_repo,
  latest_repo,
  average_stars_per_repo,
  has_profile_readme,
  account_created_at,
  analyzed_at,
  created_at,
  updated_at
`;

const normalizeProfile = (profile) => {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    top_languages:
      typeof profile.top_languages === 'string'
        ? JSON.parse(profile.top_languages)
        : profile.top_languages,
    profile_badges:
      typeof profile.profile_badges === 'string'
        ? JSON.parse(profile.profile_badges)
        : profile.profile_badges || [],
    has_profile_readme: Boolean(profile.has_profile_readme),
  };
};

const upsertProfile = async (profile) => {
  const sql = `
    INSERT INTO github_profiles (
      username,
      name,
      bio,
      location,
      company,
      blog,
      avatar_url,
      github_url,
      public_repos,
      followers,
      following,
      total_stars,
      total_forks,
      top_languages,
      developer_score,
      profile_summary,
      profile_badges,
      most_starred_repo,
      latest_repo,
      average_stars_per_repo,
      has_profile_readme,
      account_created_at,
      analyzed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      bio = VALUES(bio),
      location = VALUES(location),
      company = VALUES(company),
      blog = VALUES(blog),
      avatar_url = VALUES(avatar_url),
      github_url = VALUES(github_url),
      public_repos = VALUES(public_repos),
      followers = VALUES(followers),
      following = VALUES(following),
      total_stars = VALUES(total_stars),
      total_forks = VALUES(total_forks),
      top_languages = VALUES(top_languages),
      developer_score = VALUES(developer_score),
      profile_summary = VALUES(profile_summary),
      profile_badges = VALUES(profile_badges),
      most_starred_repo = VALUES(most_starred_repo),
      latest_repo = VALUES(latest_repo),
      average_stars_per_repo = VALUES(average_stars_per_repo),
      has_profile_readme = VALUES(has_profile_readme),
      account_created_at = VALUES(account_created_at),
      analyzed_at = NOW()
  `;

  const values = [
    profile.username,
    profile.name,
    profile.bio,
    profile.location,
    profile.company,
    profile.blog,
    profile.avatar_url,
    profile.github_url,
    profile.public_repos,
    profile.followers,
    profile.following,
    profile.total_stars,
    profile.total_forks,
    JSON.stringify(profile.top_languages),
    profile.developer_score,
    profile.profile_summary,
    JSON.stringify(profile.profile_badges),
    profile.most_starred_repo,
    profile.latest_repo,
    profile.average_stars_per_repo,
    profile.has_profile_readme,
    profile.account_created_at,
  ];

  await pool.execute(sql, values);

  return findProfileByUsername(profile.username);
};

const findAllProfiles = async () => {
  const [rows] = await pool.execute(
    `SELECT ${profileColumns} FROM github_profiles ORDER BY analyzed_at DESC`
  );

  return rows.map(normalizeProfile);
};

const findProfileByUsername = async (username) => {
  const [rows] = await pool.execute(
    `SELECT ${profileColumns} FROM github_profiles WHERE username = ? LIMIT 1`,
    [username]
  );

  return normalizeProfile(rows[0]);
};

const deleteProfileByUsername = async (username) => {
  const [result] = await pool.execute(
    'DELETE FROM github_profiles WHERE username = ?',
    [username]
  );

  return result.affectedRows > 0;
};

module.exports = {
  upsertProfile,
  findAllProfiles,
  findProfileByUsername,
  deleteProfileByUsername,
};
