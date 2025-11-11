const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const checkAuthStatus = async () => {
  try {
    const response = await apiCall('/api/auth/me');
    return response.loggedIn ? response : null;
  } catch (error) {
    return null;
  }
};

async function updateNavbar() {
  const navbar = document.querySelector('.navbar-nav');
  if (!navbar) return;

  try {
    const user = await checkAuthStatus();

    if (user && user.loggedIn) {
      ['login.html', 'signup.html'].forEach(href => {
        const link = navbar.querySelector(`a[href="${href}"]`);
        if (link) link.style.display = 'none';
      });

      if (!navbar.querySelector('.user-info')) {
        navbar.insertAdjacentHTML('beforeend', `
          <div class="user-info d-flex align-items-center">
            <a href="profile.html" title="Profile Settings" style="text-decoration:none;">
              <img id="navAvatar" src="${user.avatarUrl || 'https://via.placeholder.com/32'}" 
                alt="Avatar" 
                style="width:32px;height:32px;border-radius:50%;object-fit:cover;cursor:pointer;border:2px solid #4169E1;" 
                class="mx-2"/>
            </a>
            <span class="nav-link text-primary">Hi, ${user.username}!</span>
            <a href="#" onclick="logout()" class="nav-link text-danger">Logout</a>
          </div>
        `);
      } else {
        const img = document.getElementById('navAvatar');
        if (img) img.src = user.avatarUrl || img.src;
      }
    } else {
      ['login.html', 'signup.html'].forEach(href => {
        const link = navbar.querySelector(`a[href="${href}"]`);
        if (link) link.style.display = '';
      });

      const userInfo = navbar.querySelector('.user-info');
      if (userInfo) userInfo.remove();
    }
  } catch (error) {
    console.error('Error updating navbar:', error);
  }
}

async function logout() {
  try {
    await apiCall('/api/auth/logout', { method: 'POST' });
    alert('Logged out successfully!');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = 'index.html';
  }
}

document.addEventListener('DOMContentLoaded', updateNavbar);
