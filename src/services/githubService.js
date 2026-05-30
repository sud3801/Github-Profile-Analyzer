const axios = require('axios');

const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

githubClient.interceptors.request.use((config) => {
  if (process.env.GITHUB_TOKEN) {
    config.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return config;
});

const getGitHubErrorMessage = (error, username) => {
  if (error.response?.status === 404) {
    return `GitHub user "${username}" was not found`;
  }

  if (error.response?.status === 403) {
    return 'GitHub API rate limit reached. Add a GITHUB_TOKEN to increase the limit.';
  }

  if (error.response?.status === 401) {
    return 'GitHub token is invalid or expired. Update GITHUB_TOKEN or leave it empty for public-only access.';
  }

  return 'Unable to fetch data from GitHub';
};

const createGitHubError = (error, username) => {
  const message = getGitHubErrorMessage(error, username);
  const statusCode = error.response?.status === 404 ? 404 : error.response?.status === 401 ? 401 : 502;
  const githubError = new Error(message);
  githubError.statusCode = statusCode;
  return githubError;
};

const fetchGitHubProfile = async (username) => {
  try {
    const { data } = await githubClient.get(`/users/${username}`);
    return data;
  } catch (error) {
    throw createGitHubError(error, username);
  }
};

const fetchGitHubRepositories = async (username) => {
  try {
    const repositories = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const { data } = await githubClient.get(`/users/${username}/repos`, {
        params: {
          per_page: 100,
          page,
          sort: 'updated',
          direction: 'desc',
        },
      });

      repositories.push(...data);
      hasNextPage = data.length === 100;
      page += 1;
    }

    return repositories;
  } catch (error) {
    throw createGitHubError(error, username);
  }
};

const fetchProfileReadmeExists = async (username) => {
  try {
    await githubClient.get(`/repos/${username}/${username}/readme`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }

    throw createGitHubError(error, username);
  }
};

const fetchCompleteGitHubProfile = async (username) => {
  const [profile, repositories, hasProfileReadme] = await Promise.all([
    fetchGitHubProfile(username),
    fetchGitHubRepositories(username),
    fetchProfileReadmeExists(username),
  ]);

  return {
    profile,
    repositories,
    hasProfileReadme,
  };
};

module.exports = {
  fetchCompleteGitHubProfile,
};
