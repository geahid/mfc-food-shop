/* ===== MFC Food Shop — Auth JS ===== */

document.addEventListener('DOMContentLoaded', () => {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(loginForm)) return;

      const btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const data = await API.post('/api/users/login', {
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value
        });

        if (data.success) {
          Auth.setUser(data.user);
          Toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
          setTimeout(() => {
            window.location.href = data.user.role === 'admin' ? '/admin' : '/';
          }, 800);
        } else {
          showLoginError(data.error || 'Login failed. Check your credentials.');
        }
      } catch {
        showLoginError('Server error. Please try again.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(registerForm)) return;

      const pass = document.getElementById('regPassword').value;
      const confirm = document.getElementById('regConfirm').value;
      if (pass !== confirm) {
        const err = document.getElementById('confirmError');
        if (err) { err.textContent = 'Passwords do not match.'; err.classList.add('show'); }
        return;
      }

      const btn = registerForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        const data = await API.post('/api/users/register', {
          name: document.getElementById('regName').value,
          email: document.getElementById('regEmail').value,
          password: pass,
          phone: document.getElementById('regPhone').value
        });

        if (data.success) {
          Auth.setUser(data.user);
          Toast.success('Account created successfully!');
          setTimeout(() => window.location.href = '/', 800);
        } else {
          showRegError(data.error || 'Registration failed.');
        }
      } catch {
        showRegError('Server error. Please try again.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  // Redirect if already logged in
  if (Auth.isLoggedIn() && (loginForm || registerForm)) {
    const user = Auth.getUser();
    window.location.href = user.role === 'admin' ? '/admin' : '/';
  }
});

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  else Toast.error(msg);
}

function showRegError(msg) {
  const el = document.getElementById('regError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  else Toast.error(msg);
}
