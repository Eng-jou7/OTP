// ===== Dashboard App =====
(function() {
  const API_BASE = '/api';
  
  function getToken() { return localStorage.getItem('accessToken'); }
  function getRefreshToken() { return localStorage.getItem('refreshToken'); }

  // Toast (simplified for dashboard page)
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); }, duration);
  }

  async function refreshToken() {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: getRefreshToken() })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        return data.tokens.accessToken;
      }
    } catch (e) {}
    return null;
  }

  async function fetchUser(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }

  async function loadDashboard() {
    let token = getToken();
    if (!token) { window.location.href = '/'; return; }

    try {
      let data = await fetchUser(token);
      
      // If token expired, try refresh
      if (!data.success && data.code === 'TOKEN_EXPIRED') {
        token = await refreshToken();
        if (!token) { window.location.href = '/'; return; }
        data = await fetchUser(token);
      }

      if (!data.success) { window.location.href = '/'; return; }

      const user = data.user;

      // Set user name
      const nameEl = document.getElementById('user-name');
      if (nameEl) nameEl.textContent = user.name || 'User';

      // Set avatar
      const avatarEl = document.getElementById('user-avatar');
      if (avatarEl) {
        if (user.avatar) {
          avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}">`;
        } else {
          const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          avatarEl.textContent = initials;
        }
      }

      // Set info fields
      const fields = {
        'info-name': user.name || '—',
        'info-email': user.email || '—',
        'info-phone': user.phone ? `${user.phone} ${user.phoneVerified ? '✓ Verified' : ''}` : '—',
        'info-provider': (user.authProvider || 'local').charAt(0).toUpperCase() + (user.authProvider || 'local').slice(1),
        'info-member-since': new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        'info-id': user._id || user.id || '—'
      };
      Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });

    } catch (err) {
      showToast('Failed to load user data', 'error');
      setTimeout(() => { window.location.href = '/'; }, 2000);
    }
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: getRefreshToken() })
        });
      } catch (e) {}
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
    });
  }

  // Init
  loadDashboard();
})();
