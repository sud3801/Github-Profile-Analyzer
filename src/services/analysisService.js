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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getDaysSinceLatestUpdate = (latestRepo) => {
  if (!latestRepo?.updated_at) {
    return null;
  }

  const updatedAt = new Date(latestRepo.updated_at);
  const diffMs = Date.now() - updatedAt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const getDeveloperScore = ({
  profile,
  repositories,
  totalStars,
  totalForks,
  languages,
  hasProfileReadme,
  latestRepo,
}) => {
  const repoScore = clamp(profile.public_repos, 0, 30);
  const followersScore = clamp(Math.log10(profile.followers + 1) * 10, 0, 20);
  const starsScore = clamp(Math.log10(totalStars + 1) * 10, 0, 20);
  const forksScore = clamp(Math.log10(totalForks + 1) * 6, 0, 10);
  const languageScore = clamp(Object.keys(languages).length * 2, 0, 8);
  const readmeScore = hasProfileReadme ? 5 : 0;
  const daysSinceLatestUpdate = getDaysSinceLatestUpdate(latestRepo);
  const activityScore =
    daysSinceLatestUpdate === null
      ? 0
      : daysSinceLatestUpdate <= 30
        ? 7
        : daysSinceLatestUpdate <= 180
          ? 4
          : 1;
  const descriptionScore = repositories.some((repo) => repo.description) ? 5 : 0;

  return Math.round(
    repoScore +
      followersScore +
      starsScore +
      forksScore +
      languageScore +
      readmeScore +
      activityScore +
      descriptionScore
  );
};

const getProfileBadges = ({
  profile,
  repositories,
  totalStars,
  languages,
  hasProfileReadme,
  latestRepo,
  developerScore,
}) => {
  const badges = [];
  const daysSinceLatestUpdate = getDaysSinceLatestUpdate(latestRepo);

  if (developerScore >= 80) {
    badges.push('Elite Profile');
  } else if (developerScore >= 60) {
    badges.push('Strong Profile');
  }

  if (hasProfileReadme) {
    badges.push('Profile README');
  }

  if (Object.keys(languages).length >= 4) {
    badges.push('Polyglot');
  }

  if (totalStars >= 1000) {
    badges.push('Community Favorite');
  } else if (totalStars >= 100) {
    badges.push('Open Source Traction');
  }

  if (profile.followers >= 1000) {
    badges.push('High Reach');
  }

  if (daysSinceLatestUpdate !== null && daysSinceLatestUpdate <= 30) {
    badges.push('Recently Active');
  }

  if (repositories.length >= 20) {
    badges.push('Prolific Builder');
  }

  if (badges.length === 0) {
    badges.push('Growing Profile');
  }

  return badges.slice(0, 6);
};

const getProfileSummary = ({
  profile,
  repositories,
  totalStars,
  languages,
  mostStarredRepo,
  latestRepo,
  developerScore,
}) => {
  const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0];
  const daysSinceLatestUpdate = getDaysSinceLatestUpdate(latestRepo);
  const activityText =
    daysSinceLatestUpdate === null
      ? 'has limited recent repository activity visible'
      : daysSinceLatestUpdate <= 30
        ? 'has been active recently'
        : daysSinceLatestUpdate <= 180
          ? 'shows moderate recent activity'
          : 'has older public repository activity';
  const reachText =
    profile.followers >= 1000
      ? 'strong community reach'
      : profile.followers >= 100
        ? 'a growing audience'
        : 'an early public audience';
  const repoText =
    repositories.length > 0
      ? `${repositories.length} public repositories analyzed`
      : 'no public repositories analyzed';
  const starText =
    totalStars > 0
      ? `${totalStars.toLocaleString()} total stars`
      : 'limited public star traction so far';
  const languageText = topLanguage ? `with ${topLanguage} as a leading language` : 'with no dominant language detected';
  const standoutText = mostStarredRepo
    ? `The standout repository is ${mostStarredRepo.name}.`
    : 'No standout repository was detected yet.';

  return `${profile.login} scores ${developerScore}/100, ${activityText}, and has ${reachText}. There are ${repoText}, ${starText}, ${languageText}. ${standoutText}`;
};

const analyzeGitHubProfile = ({ profile, repositories, hasProfileReadme }) => {
  const totalStars = repositories.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0
  );
  const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
  const topLanguages = getTopLanguages(repositories);
  const mostStarredRepo = getMostStarredRepository(repositories);
  const latestRepo = getLatestRepository(repositories);
  const averageStarsPerRepo =
    repositories.length > 0 ? Number((totalStars / repositories.length).toFixed(2)) : 0;
  const developerScore = getDeveloperScore({
    profile,
    repositories,
    totalStars,
    totalForks,
    languages: topLanguages,
    hasProfileReadme,
    latestRepo,
  });
  const profileBadges = getProfileBadges({
    profile,
    repositories,
    totalStars,
    languages: topLanguages,
    hasProfileReadme,
    latestRepo,
    developerScore,
  });
  const profileSummary = getProfileSummary({
    profile,
    repositories,
    totalStars,
    languages: topLanguages,
    mostStarredRepo,
    latestRepo,
    developerScore,
  });

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
    top_languages: topLanguages,
    developer_score: developerScore,
    profile_summary: profileSummary,
    profile_badges: profileBadges,
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
