const STORAGE_KEY = 'vital-auth-user';
const USERS_KEY = 'vital-users';
const authCard = document.getElementById('auth-card');
const authMessage = document.getElementById('auth-message');
const authStatusPill = document.getElementById('auth-status-pill');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const accountDashboard = document.getElementById('account-dashboard');
const dashboardName = document.getElementById('dashboard-name');
const dashboardEmail = document.getElementById('dashboard-email');
const logoutBtn = document.getElementById('logout-btn');
const loginTab = document.getElementById('show-login-tab');
const registerTab = document.getElementById('show-register-tab');

function getStoredUsers() {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }

    const currentUser = getStoredUser();
    if (currentUser) {
      return [currentUser];
    }

    return [];
  } catch {
    return [];
  }
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function showMessage(text, isError = false) {
  authMessage.textContent = text;
  authMessage.className = `auth-message ${isError ? 'auth-message-error' : 'auth-message-success'}`;
}

function showAuthView() {
  authCard.classList.remove('d-none');
  accountDashboard.classList.add('d-none');
}

function redirectToLandingPage() {
  window.location.href = 'index.html';
}

function showSuccessModal(userName) {
  let modal = document.getElementById('auth-success-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'auth-success-modal';
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-body text-center py-5">
          <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
          <h4 class="mb-3">Welcome ${userName}!</h4>
          <p class="text-muted mb-4">You have logged in successfully. Get ready to explore amazing products.</p>
        </div>
        <div class="modal-footer border-0 justify-content-center">
          <button type="button" class="btn btn-primary-custom btn-lg" onclick="window.location.href='index.html';">Explore Our Products</button>
        </div>
      </div>
    </div>
  `;

  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
}

function showDashboard(user) {
  authCard.classList.add('d-none');
  accountDashboard.classList.remove('d-none');
  dashboardName.textContent = `Welcome, ${user.name}`;
  dashboardEmail.textContent = user.email;
  window.dispatchEvent(new Event('authStateChanged'));
}

function toggleMode(mode) {
  document.querySelectorAll('.auth-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  document.querySelectorAll('.auth-form').forEach((form) => {
    form.classList.toggle('active-form', form.id === `${mode}-form`);
  });

  authStatusPill.textContent = mode === 'login' ? 'New here?' : 'Already have an account?';
}

function initAuthState() {
  const user = getStoredUser();

  if (user) {
    showDashboard(user);
    showMessage('You are already signed in.');
    return;
  }

  showAuthView();
  toggleMode('login');
}

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const users = getStoredUsers();

  if (!email || !password) {
    showMessage('Please enter both your email and password.', true);
    return;
  }

  const matchedUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password);

  if (!matchedUser) {
    showMessage('No account found for that email and password.', true);
    return;
  }

  setStoredUser(matchedUser);
  saveUsers(users);
  showMessage('Login successful. Welcome back!');
  showDashboard(matchedUser);
  showSuccessModal(matchedUser.name.split(' ')[0]);
});

registerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const termsChecked = document.getElementById('register-terms').checked;

  if (!name || !email || !password || !confirmPassword) {
    showMessage('Please fill out every field.', true);
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters long.', true);
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match.', true);
    return;
  }

  if (!termsChecked) {
    showMessage('Please accept the terms and privacy policy.', true);
    return;
  }

  const users = getStoredUsers();
  const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    showMessage('An account with this email already exists. Please log in instead.', true);
    return;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  saveUsers(users);
  setStoredUser(newUser);
  showMessage('Account created successfully. You are now signed in.');
  showDashboard(newUser);
  showSuccessModal(newUser.name.split(' ')[0]);
});

logoutBtn?.addEventListener('click', () => {
  clearStoredUser();
  showAuthView();
  showMessage('You have been logged out.');
  toggleMode('login');
  window.dispatchEvent(new Event('authStateChanged'));
});

loginTab?.addEventListener('click', () => toggleMode('login'));
registerTab?.addEventListener('click', () => toggleMode('register'));
window.addEventListener('authStateChanged', () => {
  initAuthState();
});

initAuthState();
