const API_BASE = '/api';

// ===== Toast System =====
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); }, duration);
}

// ===== Tab Switching =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const tabIndicator = document.querySelector('.tab-indicator');

tabBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    tabIndicator.style.transform = `translateX(${index * 100}%)`;
    const map = { login: 'login-form', register: 'register-form', phone: 'phone-form', 'email-otp': 'email-otp-form' };
    document.getElementById(map[btn.dataset.tab]).classList.add('active');
  });
});

// ===== Toggle Password =====
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
    btn.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
  });
});

// ===== Password Strength =====
const regPwd = document.getElementById('register-password');
if (regPwd) {
  regPwd.addEventListener('input', (e) => {
    const val = e.target.value;
    const bars = document.querySelectorAll('.strength-bar');
    const text = document.querySelector('.strength-text');
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    bars.forEach((bar, i) => {
      bar.className = 'strength-bar';
      if (i < s) bar.classList.add(s <= 1 ? 'weak' : s <= 2 ? 'medium' : 'strong');
    });
    text.textContent = ['', 'Weak', 'Fair', 'Good', 'Strong'][s];
    text.style.color = ['', 'var(--error)', 'var(--warning)', 'var(--success)', 'var(--success)'][s];
  });
}

// ===== Loading State =====
function setLoading(btn, loading) {
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

// ===== Login =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  setLoading(btn, true);
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 1000);
    } else {
      showToast(data.message || data.errors?.map(e => e.msg).join(', ') || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ===== Register =====
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  setLoading(btn, true);
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value
      })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      showToast('Account created! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard.html', 1000);
    } else {
      showToast(data.message || data.errors?.map(e => e.msg).join(', ') || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ===== Google Login =====
document.getElementById('google-login-btn').addEventListener('click', () => {
  window.location.href = `${API_BASE}/google`;
});

// ===== Check URL Params (OAuth callback) =====
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refreshToken = params.get('refreshToken');
  const error = params.get('error');
  if (token && refreshToken) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    window.history.replaceState({}, '', '/');
    showToast('Google login successful!', 'success');
    setTimeout(() => window.location.href = '/dashboard.html', 1000);
  }
  if (error) showToast('Authentication failed. Please try again.', 'error');
  if (localStorage.getItem('accessToken') && !token) window.location.href = '/dashboard.html';
});
