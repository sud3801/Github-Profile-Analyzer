const getTopLanguages = (repositories) => {
  return repositories.reduce((languages, repo) => {
    if (!repo.language) {
      return languages;
    }

    languages[repo.language] = (languages[repo.language] || 0) + 1;
    return languages;
  }, {});
};

const getMostStarredRepository = (repositories) => {
  if (repositories.length === 0) {
    return null;
  }

  return repositories.reduce((topRepo, repo) => {
    return repo.stargazers_count > topRepo.stargazers_count ? repo : topRepo;
  }, repositories[0]);
};

const getLatestRepository = (repositories) => {
  if (repositories.length === 0) {
    return null;
  }

  return repositories.reduce((latestRepo, repo) => {
    return new Date(repo.updated_at) > new Date(latestRepo.updated_at)
      ? repo
      : latestRepo;
  }, repositories[0]);
};

const analyzeGitHubProfile = ({ profile, repositories, hasProfileReadme }) => {
  const totalStars = repositories.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0
  );
  const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
  const mostStarredRepo = getMostStarredRepository(repositories);
  const latestRepo = getLatestRepository(repositories);
  const averageStarsPerRepo =
    repositories.length > 0 ? Number((totalStars / repositories.length).toFixed(2)) : 0;

  return {
    username: profile.login,
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    company: profile.company,
    blog: profile.blog,
    avatar_url: profile.avatar_url,
    github_url: profile.html_url,
    public_repos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    total_stars: totalStars,
    total_forks: totalForks,
    top_languages: getTopLanguages(repositories),
    most_starred_repo: mostStarredRepo?.name || null,
    latest_repo: latestRepo?.name || null,
    average_stars_per_repo: averageStarsPerRepo,
    has_profile_readme: hasProfileReadme,
    account_created_at: profile.created_at
      ? profile.created_at.replace('T', ' ').replace('Z', '')
      : null,
  };
};

module.exports = {
  analyzeGitHubProfile,
};
