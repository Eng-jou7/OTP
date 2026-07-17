// ===== Phone OTP Flow =====
(function() {
  const API_BASE = '/api';
  let currentPhone = '';
  let selectedChannel = 'sms';
  let countdownInterval = null;

  const phoneForm = document.getElementById('phoneForm');
  const otpVerifyForm = document.getElementById('otpVerifyForm');
  const stepPhone = document.getElementById('otp-step-phone');
  const stepVerify = document.getElementById('otp-step-verify');
  const phoneDisplay = document.getElementById('otp-phone-display');
  const otpDigits = document.querySelectorAll('.otp-digit:not(.email-otp-digit)');
  const countdownEl = document.getElementById('otp-countdown');
  const timerText = document.getElementById('otp-timer-text');
  const resendBtn = document.getElementById('resend-otp-btn');
  const changePhoneBtn = document.getElementById('change-phone-btn');

  // Channel selector
  const channelBtns = document.querySelectorAll('.channel-btn');
  channelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      channelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedChannel = btn.dataset.channel;
    });
  });

  // Auto-focus and navigation for OTP digits
  otpDigits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;
      if (val && index < 5) otpDigits[index + 1].focus();
      e.target.classList.toggle('filled', !!val);
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpDigits[index - 1].focus();
        otpDigits[index - 1].value = '';
        otpDigits[index - 1].classList.remove('filled');
      }
    });

    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
      pasteData.split('').forEach((char, i) => {
        if (otpDigits[i]) {
          otpDigits[i].value = char;
          otpDigits[i].classList.add('filled');
        }
      });
      if (pasteData.length > 0) otpDigits[Math.min(pasteData.length, 5)].focus();
    });
  });

  function startCountdown() {
    let seconds = 60;
    countdownEl.textContent = seconds;
    timerText.style.display = 'inline';
    resendBtn.style.display = 'none';
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      seconds--;
      countdownEl.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(countdownInterval);
        timerText.style.display = 'none';
        resendBtn.style.display = 'inline';
      }
    }, 1000);
  }

  function showVerifyStep() {
    stepPhone.style.display = 'none';
    stepVerify.style.display = 'block';
    const channelLabel = selectedChannel === 'whatsapp' ? ' (WhatsApp)' : ' (SMS)';
    phoneDisplay.textContent = currentPhone + channelLabel;
    otpDigits.forEach(d => { d.value = ''; d.classList.remove('filled'); });
    otpDigits[0].focus();
    startCountdown();
  }

  function showPhoneStep() {
    stepVerify.style.display = 'none';
    stepPhone.style.display = 'block';
    clearInterval(countdownInterval);
  }

  // Send OTP
  phoneForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('send-otp-btn');
    const phone = document.getElementById('phone-number').value.trim();
    if (!phone) { showToast('Please enter a phone number', 'error'); return; }
    currentPhone = phone;
    setLoading(btn, true);
    try {
      const res = await fetch(`${API_BASE}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel: selectedChannel })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'OTP sent successfully!', 'success');
        if (data.devInfo) showToast(data.devInfo, 'info', 8000);
        showVerifyStep();
      } else {
        showToast(data.message || data.errors?.map(e => e.msg).join(', ') || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  // Verify OTP
  otpVerifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('verify-otp-btn');
    const code = Array.from(otpDigits).map(d => d.value).join('');
    if (code.length !== 6) { showToast('Please enter the complete 6-digit code', 'error'); return; }
    setLoading(btn, true);
    try {
      const res = await fetch(`${API_BASE}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentPhone, code })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        showToast('Phone verified! Redirecting...', 'success');
        setTimeout(() => window.location.href = '/dashboard.html', 1000);
      } else {
        showToast(data.message || 'Invalid OTP code', 'error');
        otpDigits.forEach(d => { d.value = ''; d.classList.remove('filled'); });
        otpDigits[0].focus();
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  // Resend OTP
  resendBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_BASE}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentPhone, channel: selectedChannel })
      });
      const data = await res.json();
      if (data.success) {
        showToast('OTP resent!', 'success');
        if (data.devInfo) showToast(data.devInfo, 'info', 8000);
        startCountdown();
      } else {
        showToast(data.message || 'Failed to resend', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  });

  changePhoneBtn.addEventListener('click', showPhoneStep);
})();

// ===== Email OTP Flow =====
(function() {
  const API_BASE = '/api';
  let currentEmail = '';
  let emailCountdownInterval = null;

  const emailOtpForm = document.getElementById('emailOtpForm');
  const emailOtpVerifyForm = document.getElementById('emailOtpVerifyForm');
  const stepEmail = document.getElementById('email-otp-step-email');
  const stepVerify = document.getElementById('email-otp-step-verify');
  const emailDisplay = document.getElementById('email-otp-display');
  const emailOtpDigits = document.querySelectorAll('.email-otp-digit');
  const countdownEl = document.getElementById('email-otp-countdown');
  const timerText = document.getElementById('email-otp-timer-text');
  const resendBtn = document.getElementById('resend-email-otp-btn');
  const changeEmailBtn = document.getElementById('change-email-btn');

  // Auto-focus and navigation for email OTP digits
  emailOtpDigits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;
      if (val && index < 5) emailOtpDigits[index + 1].focus();
      e.target.classList.toggle('filled', !!val);
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        emailOtpDigits[index - 1].focus();
        emailOtpDigits[index - 1].value = '';
        emailOtpDigits[index - 1].classList.remove('filled');
      }
    });

    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
      pasteData.split('').forEach((char, i) => {
        if (emailOtpDigits[i]) {
          emailOtpDigits[i].value = char;
          emailOtpDigits[i].classList.add('filled');
        }
      });
      if (pasteData.length > 0) emailOtpDigits[Math.min(pasteData.length, 5)].focus();
    });
  });

  function startEmailCountdown() {
    let seconds = 60;
    countdownEl.textContent = seconds;
    timerText.style.display = 'inline';
    resendBtn.style.display = 'none';
    clearInterval(emailCountdownInterval);
    emailCountdownInterval = setInterval(() => {
      seconds--;
      countdownEl.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(emailCountdownInterval);
        timerText.style.display = 'none';
        resendBtn.style.display = 'inline';
      }
    }, 1000);
  }

  function showEmailVerifyStep() {
    stepEmail.style.display = 'none';
    stepVerify.style.display = 'block';
    emailDisplay.textContent = currentEmail;
    emailOtpDigits.forEach(d => { d.value = ''; d.classList.remove('filled'); });
    emailOtpDigits[0].focus();
    startEmailCountdown();
  }

  function showEmailStep() {
    stepVerify.style.display = 'none';
    stepEmail.style.display = 'block';
    clearInterval(emailCountdownInterval);
  }

  // Send Email OTP
  emailOtpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('send-email-otp-btn');
    const email = document.getElementById('email-otp-input').value.trim();
    if (!email) { showToast('Please enter your email', 'error'); return; }
    currentEmail = email;
    setLoading(btn, true);
    try {
      const res = await fetch(`${API_BASE}/otp/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Verification code sent to your email!', 'success');
        if (data.devInfo) showToast(data.devInfo, 'info', 8000);
        showEmailVerifyStep();
      } else {
        showToast(data.message || data.errors?.map(e => e.msg).join(', ') || 'Failed to send code', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  // Verify Email OTP
  emailOtpVerifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('verify-email-otp-btn');
    const code = Array.from(emailOtpDigits).map(d => d.value).join('');
    if (code.length !== 6) { showToast('Please enter the complete 6-digit code', 'error'); return; }
    setLoading(btn, true);
    try {
      const res = await fetch(`${API_BASE}/otp/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, code })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        showToast('Email verified! Redirecting...', 'success');
        setTimeout(() => window.location.href = '/dashboard.html', 1000);
      } else {
        showToast(data.message || 'Invalid code', 'error');
        emailOtpDigits.forEach(d => { d.value = ''; d.classList.remove('filled'); });
        emailOtpDigits[0].focus();
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  // Resend Email OTP
  resendBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_BASE}/otp/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Code resent!', 'success');
        if (data.devInfo) showToast(data.devInfo, 'info', 8000);
        startEmailCountdown();
      } else {
        showToast(data.message || 'Failed to resend', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  });

  changeEmailBtn.addEventListener('click', showEmailStep);
})();
