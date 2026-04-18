/* =====================================================
   ResumeX — app.js
   ===================================================== */

const API_BASE = 'http://localhost:8005';

// ---- TOAST NOTIFICATIONS ----
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '10000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.style.background = type === 'info' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : (type === 'success' ? '#22c55e' : '#ef4444');
  toast.style.color = '#fff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
  toast.style.fontFamily = 'Syne, sans-serif';
  toast.style.fontWeight = '600';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast; // Return element so we can remove it manually if needed
}

// ---- PAGE NAVIGATION ----
const ROLE_PAGE_MAP = {
  student: 'dashboard',
  hr:      'hr',
  admin:   'admin'
};

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    
    // Automatically switch to the default view for this page
    if (pageId === 'dashboard') switchTab('overview');
    else if (pageId === 'hr') switchTab('hr-dashboard');
    else if (pageId === 'admin') switchTab('admin-dashboard');
    
    window.scrollTo(0, 0);
  }
}

function switchTab(tabId, element) {
  // 1. Update active state on sidebar links
  if (element) {
    const parentNav = element.closest('.sidebar-nav') || document.querySelector('.page.active .sidebar-nav');
    if (parentNav) {
      parentNav.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    }
    element.classList.add('active');
  } else {
    // If no element, find the link by data-tab in the active page
    const activeSidebar = document.querySelector('.page.active .sidebar-nav');
    if (activeSidebar) {
      activeSidebar.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.dataset.tab === tabId || link.dataset.view === tabId) {
          activeSidebar.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }
  }

  // 2. Switch the view
  const targetView = document.getElementById('view-' + tabId);
  if (targetView) {
    const container = targetView.closest('.view-container');
    if (container) {
      container.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    }
    targetView.classList.add('active');
  }

  // 3. Update topbar title if applicable
  const label = element ? element.innerText.split('\n')[0].trim() : '';
  const topbarTitle = document.querySelector('.page.active .topbar-title');
  if (topbarTitle && label) {
    topbarTitle.innerText = label;
  }

  // 4. Run data-refresh triggers based on tabId
  if (tabId === 'overview') {
      fetchDashboardData();
      loadNotifications();
  }
  else if (tabId === 'profile') loadProfile();
  else if (tabId === 'jobs') loadStudentJobBoard();
  else if (tabId === 'admin-dashboard') loadAdminStats();
  else if (tabId === 'admin-users') fetchAdminUsers();
  else if (tabId === 'admin-jobs') fetchAdminJobs();
  else if (tabId === 'hr-postings') loadMyJobs();
  else if (tabId === 'hr-dashboard') loadHRDashboard();
  else if (tabId === 'hr-shortlisted') loadShortlistedCandidates();
}

// Compatibility Alias
function switchView(id, el) { switchTab(id, el); }

// ---- AUTH LOGIC ----
let selectedRole = 'student';

function selectRole(btn) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedRole = btn.dataset.role;

  // Toggle HR fields
  const hrFields = document.getElementById('hr-registration-fields');
  if (hrFields) {
    hrFields.style.display = (selectedRole === 'hr') ? 'block' : 'none';
  }
}

function toggleAuthMode(mode) {
  if (mode === 'register') {
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = 'block';
  } else {
    document.getElementById('register-form-section').style.display = 'none';
    document.getElementById('login-form-section').style.display = 'block';
  }
}

async function handleAuth(mode) {
  if (mode === 'login') {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    
    try {
      const fd = new FormData();
      fd.append('username', email);
      fd.append('password', pass);
      const res = await fetch(API_BASE + '/login', {
        method: 'POST',
        body: fd
      });
      if (!res.ok) {
        let errData = { detail: 'Invalid credentials' };
        try { errData = await res.json(); } catch(e) {}
        throw new Error(errData.detail);
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      finishAuthFlow(data.user.role);
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }
  } else {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const pass = document.getElementById('register-pass').value;
    const errEl = document.getElementById('register-error');
    
    try {
      const payload = { name, email, password: pass, role: selectedRole };
      
      // If HR, collect extra fields
      if (selectedRole === 'hr') {
        payload.companyName = document.getElementById('register-company').value;
        payload.linkedInUrl = document.getElementById('register-linkedin').value;
        payload.position = document.getElementById('register-position').value;
      }

      const res = await fetch(API_BASE + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Registration failed');
      }
      // After successful registration, show login form
      toggleAuthMode('login');
      document.getElementById('login-email').value = email;
      document.getElementById('login-pass').value = pass;
      
      if (selectedRole === 'hr') {
        showToast('Registration successful! Contact admin for approval.', 'success', 6000);
      } else {
        showToast('Account created successfully! Please log in to continue.', 'success', 4000);
      }
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }
  }
}

function finishAuthFlow(role) {
  const page = ROLE_PAGE_MAP[role] || 'dashboard';
  showPage(page);
  
  if (page === 'dashboard') {
    fetchDashboardData();
    loadNotifications();
  }
  if (page === 'admin') setTimeout(() => { initAdminCharts(); fetchPendingHRs(); }, 300);
  if (page === 'hr') renderCandidates(candidatesData);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showPage('login');
}


// Auto-bind all sidebar links with data-tab
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = el.getAttribute('data-tab');
      switchTab(tabId, el);
    });
  });
  
  // Also handle [data-view] legacy elements
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = el.getAttribute('data-view');
      switchTab(viewId, el);
    });
  });
});

async function fetchDashboardData() {
  const token = localStorage.getItem('token');
  if(!token) return;

  try {
    const res = await fetch(API_BASE + '/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(res.ok) {
      const data = await res.json();
      updateDashboardUI(data);
    }
  } catch(e) {
    console.error(e);
  }
}

function updateDashboardUI(data) {
  const grid = document.querySelector('.dashboard-grid');
  const statsGrid = document.querySelector('.stats-grid');
  const welcomeP = document.querySelector('.welcome-banner p');

  if (data.has_resume) {
    document.querySelector('.big-num').innerText = data.score;
    const tags = data.skills.map(s => `<span class="tag tag-green">${s}</span>`).join('');
    document.getElementById('analysis-tags').innerHTML = tags;
    
    if (grid) grid.style.display = 'grid';
    if (statsGrid) statsGrid.style.display = 'grid';
    if (welcomeP) welcomeP.style.display = 'block';
  } else {
    // Hide dummy data if user has no resumes analyzed yet
    if (grid) grid.style.display = 'none';
    if (statsGrid) statsGrid.style.display = 'none';
    if (welcomeP) welcomeP.style.display = 'none';
  }
  
  // Update Greeting
  const h2 = document.querySelector('.welcome-banner h2');
  if (h2) h2.innerHTML = `Good morning, ${data.user_name} 👋`;

  // Update Sidebar and Topbar Name
  const userInfos = document.querySelectorAll('.user-info strong');
  userInfos.forEach(info => info.innerText = data.user_name);
  
  // Update Avatars dynamically
  const initials = data.user_name ? data.user_name.substring(0,2).toUpperCase() : 'U';
  const avatars = document.querySelectorAll('.user-avatar');
  avatars.forEach(av => {
     if(!av.closest('.cand-header')) {
        av.innerText = initials;
     }
  });
  
  setTimeout(() => animateProgressBars(), 100);
}

// ---- ANIMATED PROGRESS BARS ----
function animateProgressBars() {
  document.querySelectorAll('.prog-fill').forEach(fill => {
    const w = fill.dataset.width || fill.style.width;
    fill.style.width = '0';
    requestAnimationFrame(() => {
      setTimeout(() => { fill.style.width = w; }, 50);
    });
  });
}

// ---- PROFILE LOGIC ----
async function loadProfile() {
  const token = localStorage.getItem('token');
  if(!token) return;

  try {
    const res = await fetch(API_BASE + '/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(res.ok) {
      const data = await res.json();
      
      document.getElementById('prof-email').value = data.email || '';
      
      const p = data.profile || {};
      
      // Dynamically update the top header card
      const displayName = document.getElementById('prof-display-name');
      if (displayName) {
          displayName.innerText = (p.firstName || p.lastName) ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'User';
      }
      const displayEmail = document.getElementById('prof-display-email');
      if (displayEmail) displayEmail.innerText = data.email || '';
      const displayRole = document.getElementById('prof-display-role');
      if (displayRole) displayRole.innerText = data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : 'Student';

      document.getElementById('prof-firstname').value = p.firstName || '';
      document.getElementById('prof-lastname').value = p.lastName || '';
      document.getElementById('prof-phone').value = p.phone || '';
      document.getElementById('prof-location').value = p.location || '';
      document.getElementById('prof-qualification').value = p.qualification || '';
      document.getElementById('prof-university').value = p.university || '';
      document.getElementById('prof-experience').value = p.experienceYears || '';
      document.getElementById('prof-salary').value = p.expectedSalary || '';
      document.getElementById('prof-bio').value = p.bio || '';
      document.getElementById('prof-linkedin').value = p.linkedinUrl || '';
      document.getElementById('prof-github').value = p.githubUrl || '';
      document.getElementById('prof-portfolio').value = p.portfolioUrl || '';
      
      // Update Resume List
      const resumeList = document.getElementById('profile-resume-list');
      if (resumeList) {
          if (data.resumes && data.resumes.length > 0) {
              resumeList.innerHTML = data.resumes.map((r, index) => {
                  const isActive = index === 0; // Most recently uploaded is "Active"
                  const dateInfo = new Date(r.createdAt).toLocaleDateString();
                  return `
                    <div class="resume-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="2" width="16" height="20" rx="2" stroke="${isActive ? '#6366f1' : '#94a3b8'}" stroke-width="1.5"/>
                        <path d="M8 7h8M8 11h8M8 15h5" stroke="${isActive ? '#6366f1' : '#94a3b8'}" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      <div>
                        <strong>${r.filename || 'Resume_' + r.id + '.pdf'}</strong>
                        <span class="muted">Uploaded ${dateInfo}</span>
                      </div>
                      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
                        <span class="tag ${isActive ? 'tag-green' : ''}">${isActive ? 'Active' : 'Old'}</span>
                        <button class="btn-ghost" style="color:#ef4444; padding:4px;" onclick="deleteResume(${r.id})">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  `;
              }).join('');
          } else {
              resumeList.innerHTML = '<p class="muted" style="padding: 12px; text-align: center;">No resumes uploaded yet.</p>';
          }
      }

      const avatars = document.querySelectorAll('.profile-avatar');
      avatars.forEach(av => av.innerText = p.firstName ? p.firstName.substring(0,2).toUpperCase() : 'U');
    }
  } catch(e) {
    console.error('Failed to load profile:', e);
  }
}

async function saveProfile() {
  const token = localStorage.getItem('token');
  if(!token) return;

  const payload = {
    firstName: document.getElementById('prof-firstname').value,
    lastName: document.getElementById('prof-lastname').value,
    phone: document.getElementById('prof-phone').value,
    location: document.getElementById('prof-location').value,
    qualification: document.getElementById('prof-qualification').value,
    university: document.getElementById('prof-university').value,
    experienceYears: parseInt(document.getElementById('prof-experience').value) || 0,
    expectedSalary: document.getElementById('prof-salary').value,
    bio: document.getElementById('prof-bio').value,
    linkedinUrl: document.getElementById('prof-linkedin').value,
    githubUrl: document.getElementById('prof-github').value,
    portfolioUrl: document.getElementById('prof-portfolio').value
  };

  try {
    const res = await fetch(API_BASE + '/profile', {
      method: 'PUT',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if(res.ok) {
      showToast('Profile updated successfully! ✅', 'success');
      loadProfile(); // refresh data
      fetchDashboardData(); // update avatar everywhere
    } else {
      showToast('Failed to update profile.', 'error');
    }
  } catch(e) {
    showToast('Network error updating profile', 'error');
  }
}

// ---- UPLOAD SIMULATOR ----
function simulateUpload() {
  const zone   = document.getElementById('upload-zone');
  const result = document.getElementById('upload-result');
  const analysis = document.getElementById('analysis-result');
  const status = document.getElementById('analyze-status');

  if (result.style.display === 'block') return;

  zone.style.display = 'none';
  result.style.display = 'block';

  const steps = ['Parsing document...', 'Extracting skills...', 'Running ATS check...', 'Generating insights...', 'Analysis complete ✓'];
  let i = 0;
  const interval = setInterval(() => {
    if (status) status.textContent = steps[i] || steps[steps.length - 1];
    i++;
    if (i >= steps.length) {
      clearInterval(interval);
      setTimeout(() => {
        analysis.style.display = 'block';
        analysis.style.animation = 'fadeUp 0.5s ease both';
        animateProgressBars();
      }, 400);
    }
  }, 450);
}

// ---- OPTIMIZER ----
let targetCompany = 'Google';
function selectCompany(tile) {
  document.querySelectorAll('.company-tile').forEach(t => t.classList.remove('active-tile'));
  tile.classList.add('active-tile');
  targetCompany = tile.innerText.trim().substring(1).trim(); // extract "Google" from "GGoogle"
}

async function runOptimizer() {
  const result = document.getElementById('optimizer-result');
  const token = localStorage.getItem('token');
  
  try {
    const res = await fetch(API_BASE + '/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ company: targetCompany })
    });
    
    if(res.ok) {
      const data = await res.json();
      
      const list = result.querySelector('.opt-list');
      list.innerHTML = data.suggestions.map(s => 
        `<div class="opt-item high-priority"><span class="opt-priority">${s.priority}</span><p>${s.text}</p></div>`
      ).join('');
      
      // Update bars
      const bars = result.querySelectorAll('.prog-bar .prog-fill');
      const spans = result.querySelectorAll('.match-score-bar > span:last-child');
      
      if(bars.length >= 2) {
        bars[0].style.width = data.current_match + '%';
        bars[1].style.width = data.improved_match + '%';
      }
      if(spans.length >= 2) {
        spans[0].textContent = data.current_match + '%';
        spans[1].textContent = data.improved_match + '%';
      }
      
      if (result) {
        result.style.display = 'block';
        result.style.animation = 'fadeUp 0.5s ease both';
        setTimeout(() => animateProgressBars(), 200);
      }
    }
  } catch(e) {
    console.error(e);
  }
}

// ---- JOB FILTER PILLS ----
document.addEventListener('click', e => {
  if (e.target.classList.contains('filter-pill')) {
    const parent = e.target.closest('.job-filters');
    if (parent) {
      parent.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
    }
  }
  if (e.target.classList.contains('sort-btn')) {
    const parent = e.target.closest('.sort-row');
    if (parent) {
      parent.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    }
  }
});

// ---- NAVBAR SCROLL ----
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ---- HR CANDIDATES DATA ----
const candidatesData = [
  {
    name: 'Priya Sharma', title: 'ML Engineer · 3 yrs', location: 'Hyderabad · Open to Remote',
    skills: ['Python', 'TensorFlow', 'SQL', 'Scikit-learn'],
    score: 94, avatar: 'PS', color: 'linear-gradient(135deg,#6366f1,#4f46e5)'
  },
  {
    name: 'Rahul Mehta', title: 'Full Stack Dev · 4 yrs', location: 'Bangalore · Hybrid',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    score: 88, avatar: 'RM', color: 'linear-gradient(135deg,#22c55e,#16a34a)'
  },
  {
    name: 'Ananya Singh', title: 'Data Scientist · 2 yrs', location: 'Remote',
    skills: ['Python', 'R', 'Tableau', 'Power BI'],
    score: 82, avatar: 'AS', color: 'linear-gradient(135deg,#f59e0b,#d97706)'
  },
  {
    name: 'Karthik Nair', title: 'Backend Engineer · 5 yrs', location: 'Chennai · Onsite',
    skills: ['Java', 'Spring Boot', 'AWS', 'Kubernetes'],
    score: 79, avatar: 'KN', color: 'linear-gradient(135deg,#ec4899,#db2777)'
  },
  {
    name: 'Shreya Patel', title: 'AI Researcher · 1 yr', location: 'Pune · Remote',
    skills: ['PyTorch', 'NLP', 'Python', 'Hugging Face'],
    score: 91, avatar: 'SP', color: 'linear-gradient(135deg,#06b6d4,#0891b2)'
  },
  {
    name: 'Vikram Rao', title: 'DevOps Engineer · 6 yrs', location: 'Hyderabad · Hybrid',
    skills: ['Terraform', 'Kubernetes', 'CI/CD', 'Azure'],
    score: 76, avatar: 'VR', color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)'
  }
];

function renderCandidates(data) {
  const grid = document.getElementById('candidates-grid');
  if (!grid) return;
  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = `Showing ${data.length} candidate${data.length !== 1 ? 's' : ''}`;

  grid.innerHTML = data.map(c => {
    const scoreClass = c.score >= 90 ? 's-high' : c.score >= 80 ? 's-mid' : 's-low';
    const skillTags = c.skills.map(s => `<span class="tag tag-blue">${s}</span>`).join('');
    return `
      <div class="glass-card candidate-card">
        <div class="cand-header">
          <div class="cand-avatar" style="background:${c.color}">${c.avatar}</div>
          <div class="cand-info">
            <strong>${c.name}</strong>
            <span>${c.title}</span>
          </div>
          <div class="cand-score ${scoreClass}">
            <div class="cand-score-val">${c.score}</div>
            <div class="cand-score-lbl">Score</div>
          </div>
        </div>
        <div class="cand-meta">📍 ${c.location}</div>
        <div class="tags-wrap">${skillTags}</div>
        <div class="cand-actions">
          <button class="btn-shortlist" onclick="toggleShortlist(this)">⭐ Shortlist</button>
          <button class="btn-download">↓ Resume</button>
        </div>
      </div>`;
  }).join('');
}

function toggleShortlist(btn) {
  btn.classList.toggle('shortlisted');
  btn.textContent = btn.classList.contains('shortlisted') ? '✅ Shortlisted' : '⭐ Shortlist';
}

function filterCandidates() {
  const query = (document.getElementById('candidate-search')?.value || '').toLowerCase();
  const filtered = query
    ? candidatesData.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.skills.some(s => s.toLowerCase().includes(query)) ||
        c.title.toLowerCase().includes(query)
      )
    : candidatesData;
  renderCandidates(filtered);
}

// ---- ADMIN CHARTS ----
function initAdminCharts() {
  drawSkillsChart();
  drawDonutChart();
  drawLineChart();
}

function drawSkillsChart() {
  const container = document.getElementById('skills-chart');
  if (!container) return;
  const skills = [
    { label: 'Python',         count: 18420, pct: 92 },
    { label: 'JavaScript',     count: 16300, pct: 82 },
    { label: 'Machine Learning',count: 14100, pct: 71 },
    { label: 'React',          count: 12800, pct: 64 },
    { label: 'SQL',            count: 11500, pct: 58 },
    { label: 'AWS',            count:  9200, pct: 46 },
    { label: 'Docker',         count:  7800, pct: 39 },
    { label: 'TensorFlow',     count:  6400, pct: 32 }
  ];
  container.innerHTML = skills.map(s => `
    <div class="bar-row">
      <span class="bar-row-label">${s.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:0%" data-pct="${s.pct}"></div></div>
      <span class="bar-count">${(s.count/1000).toFixed(1)}K</span>
    </div>`).join('');

  setTimeout(() => {
    container.querySelectorAll('.bar-fill').forEach(f => {
      f.style.width = f.dataset.pct + '%';
    });
  }, 100);
}

function drawDonutChart() {
  const canvas = document.getElementById('donut-canvas');
  const legend = document.getElementById('donut-legend');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 70, innerR = 44;

  const segments = [
    { label: '90–100',  value: 15, color: '#22c55e' },
    { label: '80–89',   value: 28, color: '#6366f1' },
    { label: '70–79',   value: 32, color: '#f59e0b' },
    { label: '60–69',   value: 16, color: '#ec4899' },
    { label: 'Below 60',value:  9, color: '#64748b' }
  ];
  const total = segments.reduce((a, s) => a + s.value, 0);
  let angle = -Math.PI / 2;
  const gap = 0.03;

  ctx.clearRect(0, 0, 200, 200);

  segments.forEach(seg => {
    const sweep = (seg.value / total) * Math.PI * 2 - gap;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle + gap / 2, angle + sweep + gap / 2);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    // Cut inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    angle += sweep + gap;
  });

  // Center label
  ctx.fillStyle = '#fff';
  ctx.font = '700 20px Syne, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('128K', cx, cy - 8);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 11px DM Sans, sans-serif';
  ctx.fillText('Resumes', cx, cy + 12);

  if (legend) {
    legend.innerHTML = segments.map(s => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${s.color}"></div>
        <span>${s.label} <strong style="color:#fff">${s.value}%</strong></span>
      </div>`).join('');
  }
}

// ---- ADMIN PENDING HRS ----
async function fetchPendingHRs() {
  const token = localStorage.getItem('token');
  if(!token) return;

  try {
    const res = await fetch(API_BASE + '/admin/pending-hrs', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(res.ok) {
      const { data } = await res.json();
      renderPendingHRs(data);
    }
  } catch(e) {
    console.error('Failed to fetch pending HRs:', e);
  }
}

function renderPendingHRs(hrs) {
  const list = document.getElementById('pending-hrs-list');
  const badge = document.getElementById('pending-hrs-badge');
  if(!list) return;

  if (badge) badge.textContent = hrs.length;

  if (hrs.length === 0) {
    list.innerHTML = '<p class="muted" style="padding: 12px">No pending applications at this time.</p>';
    return;
  }

  list.innerHTML = hrs.map(hr => `
    <div class="opt-item high-priority" style="display: flex; justify-content: space-between; align-items: center; background: rgba(99, 102, 241, 0.05);">
        <div>
           <span class="opt-priority" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b">Pending</span>
           <p style="margin:0"><strong>${hr.companyName}</strong> — User: ${hr.User ? hr.User.email : 'Unknown'}</p>
        </div>
        <button class="btn-primary btn-sm" onclick="approveHR(${hr.id})">Approve</button>
    </div>
  `).join('');
}

async function approveHR(hrId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(API_BASE + '/admin/approve-hr/' + hrId, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(res.ok) {
      showToast('HR Approved Successfully!', 'success');
      fetchPendingHRs(); // refresh
    } else {
      const err = await res.json();
      showToast(err.detail || 'Failed to approve', 'error');
    }
  } catch(e) {
    showToast('Network error during approval', 'error');
  }
}

let selectedResumeFile = null;

function openFilePicker() {
  const input = document.getElementById('resumeFile');
  if (input) {
    input.value = ''; // allow reselecting same file repeatedly
    input.click();
  }
}

function handleResumeSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  selectedResumeFile = file;

  const zone = document.getElementById('upload-zone');
  const result = document.getElementById('upload-result');
  const status = document.getElementById('analyze-status');

  if (zone) zone.style.display = 'none';
  if (result) result.style.display = 'block';
  if (status) status.textContent = 'Ready to analyze';

  const fileNameEl = document.getElementById('display-filename');
  const fileSizeEl = document.getElementById('display-filesize');

  if (fileNameEl) fileNameEl.textContent = file.name;
  if (fileSizeEl) fileSizeEl.textContent = (file.size / 1024).toFixed(0) + ' KB';
}

function cancelSelection() {
  selectedResumeFile = null;
  const input = document.getElementById('resumeFile');
  if (input) input.value = '';
  
  document.getElementById('upload-zone').style.display = 'flex';
  document.getElementById('upload-result').style.display = 'none';
  document.getElementById('analysis-result').style.display = 'none';
}

async function analyzeResume(file) {
  let pickedFile = file;
  if (file instanceof Event) {
    pickedFile = null;
  }
  pickedFile = pickedFile || selectedResumeFile || document.getElementById('resumeFile')?.files?.[0];
  if (!pickedFile) {
    alert('Please upload a resume first.');
    return;
  }

  const formData = new FormData();
  formData.append('resume', pickedFile);

  const analyzeBtn = document.getElementById('analyze-btn');
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
  }

  const token = localStorage.getItem('token');
  
  // Real-time feedback for AI processing
  const loadingToast = showToast('Detecting Skills...', 'info', 0); // Indefinite until finished

  try {
    const response = await fetch(API_BASE + '/analyze', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      body: formData
    });

    if (!response.ok) {
      let errMsg = `Server error: ${response.status}`;
      try {
        const errData = await response.json();
        errMsg = errData.error || errData.detail || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const resJson = await response.json();
    
    // Success toast!
    loadingToast.remove();
    showToast('Analysis Complete! ✅', 'success');

    // Display formatted results safely
    displayResults(resJson.data);
    
  } catch (error) {
    console.error('Analysis failed', error);
    loadingToast.remove();
    showToast('Analysis failed: ' + error.message, 'error');
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Resume';
    }
  }
}

function displayResults(data){

  document.getElementById("analysis-result").style.display="block";
  document.querySelector(".big-num").innerText = data.score || data.overall_ats_score || 0;
  
  const fluffEl = document.getElementById('audit-fluff');
  if (fluffEl) fluffEl.innerText = data.fluff_vs_impact_analysis || "No analysis available.";

  const skillsBox = document.getElementById('analysis-tags');
  if (skillsBox) {
    skillsBox.innerHTML = '';
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      data.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'tag tag-green';
        tag.innerText = skill;
        skillsBox.appendChild(tag);
      });
    } else {
       skillsBox.innerHTML = "<span class='text-xs'>No technical skills detected.</span>";
    }
  }

  // Render Red Flags safely
  let redFlagsHtml = '';
  if (data.red_flags && Array.isArray(data.red_flags)) {
      redFlagsHtml = data.red_flags.map(flag => `<li>${flag}</li>`).join('');
  }
  const rfEl = document.getElementById('audit-red-flags');
  if (rfEl) rfEl.innerHTML = redFlagsHtml || "<li>No major red flags detected!</li>";

  // Render Strengths Safely
  let strengthsHtml = '';
  if (data.strengths && Array.isArray(data.strengths)) {
      strengthsHtml = data.strengths.map(str => `<li>${str}</li>`).join('');
  }
  const strEl = document.getElementById('audit-strengths');
  if (strEl) strEl.innerHTML = strengthsHtml || "<li>No key strengths identified.</li>";

  // Render Side by Side rewrites
  const rewritesContainer = document.getElementById('audit-rewrites');
  if (rewritesContainer) {
    let rewritesHtml = '';
    if (data.bullet_point_rewrites && Array.isArray(data.bullet_point_rewrites)) {
        rewritesHtml = data.bullet_point_rewrites.map(rw => `
          <div class="rewrite-box">
            <div class="rewrite-col">
              <h5>Original</h5>
              <p class="original-text">${rw.original_text}</p>
            </div>
            <div class="rewrite-col">
              <h5>AI Suggested</h5>
              <p class="suggested-text">${rw.ai_suggested_rewrite}</p>
            </div>
          </div>
        `).join('');
    }
    rewritesContainer.innerHTML = rewritesHtml || "<p class='muted'>Your bullet points are remarkably well written.</p>";
  }

}

function drawLineChart() {
  const canvas = document.getElementById('line-canvas');
  if (!canvas || !canvas.getContext) return;

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement?.clientWidth || 700;
  const H = 200;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const users  = [8200,11000,13500,15800,19200,22000,26500,30000,34200,39000,44000,52341];
  const max = Math.max(...users);
  const pad = { top: 20, right: 20, bottom: 30, left: 48 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const px = i => pad.left + (i / (users.length - 1)) * cw;
  const py = v => pad.top + ch - (v / max) * ch;

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, H);
  grad.addColorStop(0, 'rgba(99,102,241,0.25)');
  grad.addColorStop(1, 'rgba(99,102,241,0)');

  ctx.beginPath();
  ctx.moveTo(px(0), py(users[0]));
  for (let i = 1; i < users.length; i++) {
    const xc = (px(i - 1) + px(i)) / 2;
    ctx.bezierCurveTo(xc, py(users[i - 1]), xc, py(users[i]), px(i), py(users[i]));
  }
  ctx.lineTo(px(users.length - 1), H);
  ctx.lineTo(px(0), H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(px(0), py(users[0]));
  for (let i = 1; i < users.length; i++) {
    const xc = (px(i - 1) + px(i)) / 2;
    ctx.bezierCurveTo(xc, py(users[i - 1]), xc, py(users[i]), px(i), py(users[i]));
  }
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots
  users.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(px(i), py(v), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#818cf8';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // X labels
  ctx.fillStyle = '#64748b';
  ctx.font = '11px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  months.forEach((m, i) => {
    ctx.fillText(m, px(i), H - 6);
  });

  // Y labels
  ctx.textAlign = 'right';
  [0, 25000, 50000].forEach(v => {
    const label = v === 0 ? '0' : v >= 1000 ? (v / 1000) + 'K' : v;
    ctx.fillStyle = '#64748b';
    ctx.fillText(label, pad.left - 6, py(v) + 4);
    ctx.beginPath();
    ctx.moveTo(pad.left, py(v));
    ctx.lineTo(W - pad.right, py(v));
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  showPage('landing');

  // Animate landing page elements as they scroll into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp 0.6s ease both';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.feat-card, .step, .cta-content').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  // Redraw line chart on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.getElementById('page-admin')?.classList.contains('active')) {
        drawLineChart();
      }
    }, 200);
  });
});
document.addEventListener("DOMContentLoaded",()=>{

if(document.getElementById("candidates-grid")){
renderCandidates(candidates);
}

});
const resumeInput = document.getElementById('resumeFile');
if (resumeInput) {
  resumeInput.addEventListener('change', handleResumeSelection);
}

// ==== Admin Dashboard Features ====
async function loadAdminStats() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_BASE + '/admin/stats', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        
        document.getElementById('admin-resumes').innerText = json.data.totalResumes || 0;
        document.getElementById('admin-hrs').innerText = json.data.activeHRs || 0;
        document.getElementById('admin-students').innerText = json.data.totalStudents || 0;
        
        // Also load pending HRs
        const hrRes = await fetch(API_BASE + '/admin/pending-hrs', { headers: { 'Authorization': 'Bearer ' + token } });
        const hrJson = await hrRes.json();
        const tbody = document.getElementById('admin-hr-table-body');
        
        if(hrJson.data && hrJson.data.length > 0) {
            tbody.innerHTML = hrJson.data.map(hr => `
               <tr>
                 <td>${hr.companyName}</td>
                 <td>${hr.position || 'N/A'}</td>
                 <td>
                    <a href="${hr.linkedInUrl || '#'}" target="_blank" class="tag tag-blue" style="text-decoration:none;">
                       ${hr.linkedInUrl ? 'View Profile' : 'No Link'}
                    </a>
                 </td>
                 <td><span class="tag tag-amber">${hr.verificationStatus}</span></td>
                 <td style="text-align: right;">
                    <button class="btn-primary btn-sm" onclick="handleHRAction(${hr.id}, 'approve')">Approve</button>
                    <button class="btn-ghost btn-sm" onclick="handleHRAction(${hr.id}, 'reject')">Reject</button>
                 </td>
               </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;" class="muted">No pending requests!</td></tr>';
        }
    } catch (e) {
        console.error(e);
        alert('Failed to load Admin Stats');
    }
}

async function fetchAdminUsers() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_BASE + '/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        const tbody = document.getElementById('admin-users-table-body');
        
        if (json.data && json.data.length > 0) {
            tbody.innerHTML = json.data.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.email}</td>
                    <td><span class="tag ${u.role === 'admin' ? 'tag-pink' : (u.role === 'hr' ? 'tag-blue' : 'tag-green')}">${u.role}</span></td>
                    <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;" class="muted">No users found on the platform.</td></tr>';
        }
    } catch (e) { console.error(e); }
}

async function fetchAdminJobs() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_BASE + '/admin/jobs', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        const tbody = document.getElementById('admin-jobs-table-body');
        
        if (json.data && json.data.length > 0) {
            tbody.innerHTML = json.data.map(j => `
                <tr>
                    <td>${j.title}</td>
                    <td>${j.HR_Profile ? j.HR_Profile.companyName : 'Unknown'}</td>
                    <td>${new Date(j.createdAt).toLocaleDateString()}</td>
                    <td style="text-align: right;"><span class="muted">#${j.id}</span></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;" class="muted">No jobs are currently listed.</td></tr>';
        }
    } catch (e) { console.error(e); }
}

async function handleHRAction(id, action) {
    const token = localStorage.getItem('token');
    const endpoint = action === 'approve' ? `/admin/approve-hr/${id}` : `/admin/reject-hr/${id}`;
    
    await fetch(API_BASE + endpoint, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
    loadAdminStats(); // refresh
}

// ==== HR Dashboard Features ====
async function postJob() {
   const token = localStorage.getItem('token');
   const title = document.getElementById('hr-job-title').value;
   const desc = document.getElementById('hr-job-desc').value;
   const skills = document.getElementById('hr-job-skills').value.split(',').map(s=>s.trim());
   
   try {
       const res = await fetch(API_BASE + '/hr/jobs', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
           body: JSON.stringify({ title, description: desc, required_skills: skills })
       });
       
       if(res.ok) {
           alert('Job Deployed Successfully!');
           loadMyJobs();
       } else {
           const err = await res.json();
           alert('Failed: ' + err.error);
       }
   } catch(e) { console.error(e); }
}

async function loadMyJobs() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(API_BASE + '/hr/my-jobs', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        
        const list = document.getElementById('hr-my-jobs');
        if(json.data && json.data.length > 0) {
            list.innerHTML = json.data.map(job => `
               <li style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                 <h4 style="color:#fff; margin-bottom: 4px;">[ID: ${job.id}] ${job.title}</h4>
                 <span class="muted text-xs">${job.Skills.map(s => s.name).join(', ')}</span>
               </li>
            `).join('');
        }
    } catch(e) { console.error(e); }
}

async function runMatchmaker(jobId) {
    if (!jobId) return alert('Enter a Job ID first.');
    const token = localStorage.getItem('token');
    document.getElementById('hr-matchmaker-results').innerHTML = "<p class='muted'>🤖 Matchmaker is aggressively ranking candidates. Please wait...</p>";
    
    try {
        const res = await fetch(API_BASE + `/hr/top-candidates/${jobId}`, { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        
        let html = '';
        if(json.data && Array.isArray(json.data)) {
            json.data.forEach(candidate => {
                html += `
                  <div class="rewrite-box">
                    <div class="rewrite-col" style="flex:1;">
                      <h4 style="color: #6366f1;">Candidate Profile ID: ${candidate.studentId}</h4>
                      <h5 style="color: #4ade80;">Match Score: ${candidate.match_score}%</h5>
                    </div>
                    <div class="rewrite-col" style="flex:2;">
                      <h5>Why hire?</h5>
                      <p class="original-text" style="color:#e2e8f0; text-decoration: none;">${candidate.hire_reason}</p>
                    </div>
                  </div>
                `;
            });
            document.getElementById('hr-matchmaker-results').innerHTML = html || "<p class='muted'>No candidates met the threshold.</p>";
        } else {
            document.getElementById('hr-matchmaker-results').innerHTML = "<p class='muted' style='color:#ef4444'>Matchmaker failed to return a proper format.</p>";
        }
    } catch(e) {
        console.error(e);
        document.getElementById('hr-matchmaker-results').innerHTML = "<p class='muted' style='color:#ef4444'>Matchmaker encountered an error.</p>";
    }
}

// ==== Student Job Board Features ====

// 1. Fetch available jobs
async function loadStudentJobBoard() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_BASE + '/student/jobs', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        
        const container = document.getElementById('student-jobs-container');
        
        if(json.data && json.data.length > 0) {
            container.innerHTML = json.data.map(job => {
                const company = job.HR_Profile ? job.HR_Profile.companyName : "Unknown";
                const skills = job.Skills ? job.Skills.map(s => `<span class="tag tag-blue">${s.name}</span>`).join('') : '';
                
                return `
                <div class="job-card glass-card">
                  <h3>${job.title}</h3>
                  <div class="job-meta"><span>${company}</span></div>
                  <p class="muted" style="margin-top:10px; font-size:14px; color: #94a3b8;">${job.description || ''}</p>
                  <div class="tags-wrap mt-8">${skills}</div>
                  <div class="job-card-footer" style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn-primary btn-sm" onclick="trigger1ClickTailor(${job.id}, '${job.title}')">1-Click AI Tailor</button>
                    ${job.hasApplied 
                        ? `<button class="btn-ghost btn-sm" disabled style="color:#22c55e; border-color:#22c55e;">Applied ✅</button>` 
                        : `<button class="btn-outline btn-sm" onclick="applyToJob(${job.id})">Apply Now</button>`}
                  </div>
                </div>
                `;
            }).join('');
        } else {
            container.innerHTML = "<p class='muted'>No jobs are actively posted right now.</p>";
        }
    } catch (e) {
        console.error(e);
        document.getElementById('student-jobs-container').innerHTML = "<p class='muted'>Failed to load job board.</p>";
    }
}

async function applyToJob(jobId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_BASE + `/student/apply/${jobId}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const json = await res.json();
        if (res.ok) {
            showToast('Application submitted successfully! 🚀', 'success');
            loadStudentJobBoard(); // refresh to show "Applied"
        } else {
            showToast('Failed to apply: ' + (json.error || 'Server error'), 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error during application.', 'error');
    }
}

async function loadHRDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_BASE + '/hr/applicants', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const json = await res.json();
        
        if (!res.ok) {
            console.error('HR applicants API error:', res.status, json);
            const container = document.getElementById('hr-applicants-list');
            if (container) container.innerHTML = `<p class='muted' style='color:#ef4444'>Server error: ${json.error || res.status}</p>`;
            return;
        }

        const container = document.getElementById('hr-applicants-list');
        if (!container) { console.error('hr-applicants-list element not found'); return; }
        if (json.data && json.data.length > 0) {
            container.innerHTML = json.data.map(app => `
                <div class="job-card glass-card" style="margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <h3 style="margin-bottom: 5px;">${app.Student.firstName} ${app.Student.lastName}</h3>
                      <div class="job-meta">
                        <span>Applied for: <strong>${app.Job.title}</strong></span>
                      </div>
                      <p class="muted" style="margin-top:8px; font-size:13px;">${app.Student.university} — ${app.Student.qualification}</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn-primary btn-sm" style="background:var(--green); border-color:var(--green);" onclick="updateApplicationStatus(${app.id}, 'shortlisted')">Approve</button>
                      <button class="btn-outline btn-sm" style="color:#f87171; border-color:#f87171;" onclick="updateApplicationStatus(${app.id}, 'rejected')">Reject</button>
                    </div>
                  </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = "<p class='muted'>No new applications to review.</p>";
        }

        // Update Stats
        document.getElementById('hr-stat-new-apps').innerText = json.data ? json.data.length : 0;
        
        // Fetch shortlisted count for stats
        const sRes = await fetch(API_BASE + '/hr/shortlisted', { headers: { 'Authorization': 'Bearer ' + token } });
        const sJson = await sRes.json();
        document.getElementById('hr-stat-shortlisted').innerText = sJson.data ? sJson.data.length : 0;
        
        // Fetch jobs for stats
        const jRes = await fetch(API_BASE + '/hr/my-jobs', { headers: { 'Authorization': 'Bearer ' + token } });
        const jJson = await jRes.json();
        document.getElementById('hr-stat-active-jobs').innerText = jJson.data ? jJson.data.length : 0;

    } catch (e) {
        console.error('loadHRDashboard error:', e);
        const container = document.getElementById('hr-applicants-list');
        if (container) container.innerHTML = "<p class='muted' style='color:#ef4444'>Failed to load applications: " + e.message + "</p>";
    }
}

async function loadShortlistedCandidates() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_BASE + '/hr/shortlisted', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const json = await res.json();
        
        const container = document.getElementById('hr-shortlisted-list');
        if (json.data && json.data.length > 0) {
            container.innerHTML = json.data.map(app => `
                <div class="job-card glass-card" style="margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <h3 style="margin-bottom: 5px;">${app.Student.firstName} ${app.Student.lastName}</h3>
                      <div class="job-meta">
                        <span>Shortlisted for: <strong>${app.Job.title}</strong></span>
                      </div>
                      <p class="muted" style="margin-top:8px; font-size:13px;">${app.Student.university} — ${app.Student.qualification}</p>
                    </div>
                    <div class="tag tag-green">Shortlisted</div>
                  </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = "<p class='muted'>No candidates shortlisted yet.</p>";
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = "<p class='muted' style='color:#ef4444'>Failed to load shortlist.</p>";
    }
}

async function updateApplicationStatus(appId, status) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_BASE + `/hr/applications/${appId}/status`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (res.ok) {
            showToast(`Candidate ${status} successfully!`, 'success');
            loadHRDashboard();
        } else {
            showToast('Failed to update status.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error.', 'error');
    }
}

async function loadNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_BASE + '/notifications', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const json = await res.json();
        
        const container = document.getElementById('student-notifications-container');
        const list = document.getElementById('student-notifications-list');
        const badge = document.querySelector('.notif-dot');

        if (json.data && json.data.length > 0) {
            container.style.display = 'block';
            if (badge) badge.style.display = 'block';
            
            list.innerHTML = json.data.map(n => `
                <div class="job-card glass-card" style="margin-bottom: 12px; border-left: 4px solid var(--${n.type === 'success' ? 'green' : 'accent'});">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <h4 style="margin: 0 0 5px 0; color: var(--${n.type === 'success' ? 'green' : 'accent'});">${n.title}</h4>
                      <p style="margin: 0; font-size: 14px; line-height: 1.4;">${n.message}</p>
                      <small class="muted">${new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                    <button class="icon-btn" onclick="markNotificationRead(${n.id})" title="Dismiss">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = "<p class='muted'>No new updates at this time.</p>";
            if (badge) badge.style.display = 'none';
        }

        // Update name in dash if user data exists
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const nameEl = document.getElementById('student-name-dash');
            if (nameEl) nameEl.innerText = user.firstName || 'Student';
        }

    } catch (e) {
        console.error('Error loading notifications:', e);
    }
}

async function markNotificationRead(id) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_BASE + `/notifications/${id}/read`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            loadNotifications(); // Refresh list
        }
    } catch (e) {
        console.error('Error marking notification read:', e);
    }
}

// 2. Trigger the AI Tailor Endpoint
async function trigger1ClickTailor(jobId, jobTitle) {
    const token = localStorage.getItem('token');
    
    // Open loading modal
    const modal = document.getElementById('ai-tailor-modal');
    modal.style.display = 'flex';
    document.getElementById('ai-modal-title').innerText = `🤖 Tailoring Resume for ${jobTitle}...`;
    document.getElementById('ai-modal-results').style.display = 'none';

    try {
        const res = await fetch(API_BASE + `/student/tailor-resume/${jobId}`, { 
            method: 'POST', 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        
        const json = await res.json();
        
        if (res.ok && json.data) {
            document.getElementById('ai-modal-title').innerText = `✨ Strategically Tailored for ${jobTitle}`;
            document.getElementById('ai-tailored-summary').innerText = json.data.tailored_summary;
            
            const bulletsHtml = json.data.tweaked_bullet_points.map(bp => `
                <div class="rewrite-box" style="margin-bottom: 15px;">
                  <div class="rewrite-col">
                    <h5 style="color:#ef4444">Original Found</h5>
                    <p class="original-text" style="color:white; text-decoration: none;">${bp.original}</p>
                  </div>
                  <div class="rewrite-col">
                    <h5 style="color:#22c55e">Suggested Rewrite</h5>
                    <p class="suggested-text" style="width:100%">${bp.suggestion}</p>
                  </div>
                </div>
            `).join('');
            
            document.getElementById('ai-tweaked-bullets').innerHTML = bulletsHtml;
            document.getElementById('ai-modal-results').style.display = 'block';
        } else {
            document.getElementById('ai-modal-title').innerText = "❌ AI Integration failed or No Resume Found.";
        }
    } catch(e) {
        console.error(e);
        document.getElementById('ai-modal-title').innerText = "❌ Connection Error.";
    }
}

async function deleteResume(id) {
  if (!confirm('Are you sure you want to delete this resume? This will remove all its analysis results.')) return;
  
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(API_BASE + '/resume/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.ok) {
      showToast('Resume deleted successfully! 🗑️', 'success');
      loadProfile();
      fetchDashboardData();
    } else {
      showToast('Failed to delete resume.', 'error');
    }
  } catch(e) {
    showToast('Network error', 'error');
  }
}

// ==== INIT ====
document.addEventListener('DOMContentLoaded', () => {
  showPage('landing');

  // Animate landing page elements as they scroll into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp 0.6s ease both';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.feat-card, .step, .cta-content').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  // Redraw line chart on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.getElementById('page-admin')?.classList.contains('active')) {
        drawLineChart();
      }
    }, 200);
  });
});

// Event listener for resume file selection is already handled above (line 1077)
