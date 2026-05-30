const state = {
  profiles: [],
  selectedUsername: null,
};

const elements = {
  analyzeForm: document.querySelector('#analyzeForm'),
  usernameInput: document.querySelector('#usernameInput'),
  refreshButton: document.querySelector('#refreshButton'),
  profileList: document.querySelector('#profileList'),
  profileView: document.querySelector('#profileView'),
  statusStrip: document.querySelector('#statusStrip'),
  statusText: document.querySelector('#statusText'),
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatDate = (value) => {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
};

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const setStatus = (message, type = 'ready') => {
  elements.statusText.textContent = message;
  elements.statusStrip.className = `status-strip ${type}`;
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
};

const renderProfileList = () => {
  if (state.profiles.length === 0) {
    elements.profileList.innerHTML = '<p class="repo-label">No profiles analyzed yet.</p>';
    return;
  }

  elements.profileList.innerHTML = state.profiles
    .map(
      (profile) => `
        <button class="profile-item ${profile.username === state.selectedUsername ? 'active' : ''}" data-username="${profile.username}" type="button">
          <img class="avatar" src="${profile.avatar_url}" alt="${profile.username} avatar" />
          <span>
            <strong>${escapeHtml(profile.name || profile.username)}</strong>
            <span>@${escapeHtml(profile.username)} · ${formatNumber(profile.public_repos)} repos</span>
          </span>
        </button>
      `
    )
    .join('');
};

const renderLanguages = (languages) => {
  const entries = Object.entries(languages || {}).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return '<p class="repo-label">No primary languages found.</p>';
  }

  const maxCount = Math.max(...entries.map((entry) => entry[1]));

  return `
    <div class="language-list">
      ${entries
        .map(([language, count]) => {
          const width = Math.max(8, Math.round((count / maxCount) * 100));
          return `
            <div class="language-row">
              <span class="language-name">${escapeHtml(language)}</span>
              <span class="language-bar"><span data-width="${width}"></span></span>
              <span class="language-count">${count}</span>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
};

const renderProfile = (profile) => {
  state.selectedUsername = profile.username;
  renderProfileList();

  elements.profileView.innerHTML = `
    <article>
      <header class="profile-header">
        <img class="avatar-large" src="${profile.avatar_url}" alt="${profile.username} avatar" />
        <div class="profile-title">
          <h2>${escapeHtml(profile.name || profile.username)}</h2>
          <a href="${profile.github_url}" target="_blank" rel="noreferrer">@${escapeHtml(profile.username)}</a>
          <p>${escapeHtml(profile.bio || 'No bio available for this profile.')}</p>
        </div>
        <div class="header-actions">
          <button class="text-button danger" id="deleteButton" type="button">
            <span class="icon trash-icon" aria-hidden="true"></span>
            Delete
          </button>
        </div>
      </header>

      <section class="metric-grid" aria-label="Profile metrics">
        <div class="metric"><span>Public repos</span><strong>${formatNumber(profile.public_repos)}</strong></div>
        <div class="metric"><span>Followers</span><strong>${formatNumber(profile.followers)}</strong></div>
        <div class="metric"><span>Total stars</span><strong>${formatNumber(profile.total_stars)}</strong></div>
        <div class="metric"><span>Total forks</span><strong>${formatNumber(profile.total_forks)}</strong></div>
      </section>

      <section class="details-grid">
        <div class="detail-section">
          <h3>Top languages</h3>
          ${renderLanguages(profile.top_languages)}
        </div>

        <div class="detail-section">
          <h3>Profile details</h3>
          <div class="meta-list">
            <div class="meta-row"><span class="meta-label">Company</span><span class="meta-value">${escapeHtml(profile.company || 'Not available')}</span></div>
            <div class="meta-row"><span class="meta-label">Location</span><span class="meta-value">${escapeHtml(profile.location || 'Not available')}</span></div>
            <div class="meta-row"><span class="meta-label">Blog</span><span class="meta-value">${escapeHtml(profile.blog || 'Not available')}</span></div>
            <div class="meta-row"><span class="meta-label">Most starred</span><span class="meta-value">${escapeHtml(profile.most_starred_repo || 'Not available')}</span></div>
            <div class="meta-row"><span class="meta-label">Latest repo</span><span class="meta-value">${escapeHtml(profile.latest_repo || 'Not available')}</span></div>
            <div class="meta-row"><span class="meta-label">Avg stars</span><span class="meta-value">${profile.average_stars_per_repo}</span></div>
            <div class="meta-row"><span class="meta-label">README</span><span class="meta-value">${profile.has_profile_readme ? 'Detected' : 'Not detected'}</span></div>
            <div class="meta-row"><span class="meta-label">Created</span><span class="meta-value">${formatDate(profile.account_created_at)}</span></div>
            <div class="meta-row"><span class="meta-label">Analyzed</span><span class="meta-value">${formatDate(profile.analyzed_at)}</span></div>
          </div>
        </div>
      </section>
    </article>
  `;

  document.querySelectorAll('[data-width]').forEach((bar) => {
    bar.style.width = `${bar.dataset.width}%`;
  });
  document.querySelector('#deleteButton').addEventListener('click', () => deleteSelectedProfile(profile.username));
};

const loadProfiles = async () => {
  setStatus('Loading stored profiles...', 'loading');
  const payload = await requestJson('/api/profiles');
  state.profiles = payload.data;
  renderProfileList();

  if (state.profiles.length > 0 && !state.selectedUsername) {
    renderProfile(state.profiles[0]);
  }

  setStatus(`${state.profiles.length} stored profile${state.profiles.length === 1 ? '' : 's'}`);
};

const analyzeProfile = async (username) => {
  setStatus(`Analyzing ${username}...`, 'loading');
  const payload = await requestJson(`/api/profiles/analyze/${encodeURIComponent(username)}`, {
    method: 'POST',
  });

  await loadProfiles();
  renderProfile(payload.data);
  setStatus(`Analyzed @${payload.data.username}`);
};

const loadProfile = async (username) => {
  setStatus(`Opening ${username}...`, 'loading');
  const payload = await requestJson(`/api/profiles/${encodeURIComponent(username)}`);
  renderProfile(payload.data);
  setStatus(`Viewing @${payload.data.username}`);
};

const deleteSelectedProfile = async (username) => {
  const shouldDelete = window.confirm(`Delete stored analysis for ${username}?`);

  if (!shouldDelete) {
    return;
  }

  setStatus(`Deleting ${username}...`, 'loading');
  await requestJson(`/api/profiles/${encodeURIComponent(username)}`, { method: 'DELETE' });
  state.selectedUsername = null;
  elements.profileView.innerHTML = `
    <div class="empty-state">
      <div class="empty-mark" aria-hidden="true"></div>
      <h2>Select or analyze a profile</h2>
      <p>Stored analyses appear on the left after GitHub data is fetched.</p>
    </div>
  `;
  await loadProfiles();
  setStatus(`Deleted @${username}`);
};

elements.analyzeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = elements.usernameInput.value.trim();

  if (!username) {
    return;
  }

  try {
    await analyzeProfile(username);
    elements.usernameInput.value = '';
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.profileList.addEventListener('click', async (event) => {
  const item = event.target.closest('.profile-item');

  if (!item) {
    return;
  }

  try {
    await loadProfile(item.dataset.username);
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.refreshButton.addEventListener('click', async () => {
  try {
    await loadProfiles();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

loadProfiles().catch((error) => {
  setStatus(error.message, 'error');
});
