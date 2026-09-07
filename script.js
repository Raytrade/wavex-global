// ======================
// WAVEX GLOBAL - CORE JS
// ======================

const STORAGE_USERS = 'wavex_users';
const STORAGE_SHIPMENTS = 'wavex_shipments';
const STORAGE_SESSION = 'wavex_session';

// ---------- UTILITIES ----------
function generateTracking() {
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  return `WXG-\( {part1}- \){part2}`;
}

function showToast(message, duration = 3200) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getShipments() {
  return JSON.parse(localStorage.getItem(STORAGE_SHIPMENTS) || '[]');
}

function saveShipments(shipments) {
  localStorage.setItem(STORAGE_SHIPMENTS, JSON.stringify(shipments));
}

function getCurrentUser() {
  const email = localStorage.getItem(STORAGE_SESSION);
  if (!email) return null;
  return getUsers().find(u => u.email === email) || null;
}

function setSession(email) {
  localStorage.setItem(STORAGE_SESSION, email);
}

function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
}

// ---------- VIEW MANAGEMENT ----------
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  // Update nav visibility when logged in
  updateNav();
  if (viewId === 'dashboardView') renderDashboard();
}

function updateNav() {
  const user = getCurrentUser();
  const navActions = document.getElementById('navActions');
  if (user) {
    navActions.innerHTML = `
      <span style="color:var(--text-muted);font-size:14px;margin-right:8px;">${user.name}</span>
      <button class="btn btn-outline" onclick="logout()">Sign Out</button>
    `;
  } else {
    navActions.innerHTML = `
      <button class="btn btn-outline" onclick="showView('authView'); switchAuth('login')">Sign In</button>
      <button class="btn btn-primary" onclick="showView('authView'); switchAuth('signup')">Create Account</button>
    `;
  }
}

// ---------- AUTH ----------
function switchAuth(mode) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');

  if (mode === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
  }
}

function fillLiveLogin() {
  document.getElementById('loginEmail').value = 'real@wavex.Live';
  document.getElementById('loginPassword').value = 'Real1234';
  switchAuth('login');
}

function signup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showToast('Email already registered');
    return;
  }

  users.push({ name, email, password });
  saveUsers(users);
  setSession(email);
  showToast('Account created successfully');
  showView('dashboardView');
}

function login(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  // Seed demo account if missing
  let users = getUsers();
  if (!users.find(u => u.email === 'real@wavex.live')) {
    users.push({
      name: 'Real Client',
      email: 'real@wavex.live',
      password: 'Real1234'
    });
    saveUsers(users);
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    showToast('Invalid email or password');
    return;
  }

  setSession(email);
  showToast(`Welcome back, ${user.name}`);
  showView('dashboardView');
}

function logout() {
  clearSession();
  showToast('Signed out');
  showView('homeView');
  updateNav();
}

// ---------- SHIPMENTS ----------
function showCreateShipment() {
  document.getElementById('createShipmentCard').classList.remove('hidden');
  // Set default estimated delivery (5 days from now)
  const d = new Date();
  d.setDate(d.getDate() + 5);
  document.getElementById('estimatedDelivery').value = d.toISOString().split('T')[0];
}

function hideCreateShipment() {
  document.getElementById('createShipmentCard').classList.add('hidden');
}

function createShipment(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const tracking = generateTracking();
  const shipment = {
    id: tracking,
    tracking,
    userEmail: user.email,
    senderName: document.getElementById('senderName').value.trim(),
    senderContact: document.getElementById('senderContact').value.trim(),
    senderLocation: document.getElementById('senderLocation').value.trim(),
    receiverName: document.getElementById('receiverName').value.trim(),
    receiverContact: document.getElementById('receiverContact').value.trim(),
    receiverLocation: document.getElementById('receiverLocation').value.trim(),
    description: document.getElementById('packageDescription').value.trim(),
    weight: document.getElementById('packageWeight').value,
    service: document.getElementById('packageService').value,
    estimatedDelivery: document.getElementById('estimatedDelivery').value,
    status: 'created',
    history: [
      { status: 'created', label: 'Shipment Created', time: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  };

  const shipments = getShipments();
  shipments.unshift(shipment);
  saveShipments(shipments);

  // Reset form
  e.target.reset();
  hideCreateShipment();
  showToast(`Shipment created • ${tracking}`);
  renderDashboard();
}

function getStatusLabel(status) {
  const map = {
    created: 'Created',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    customs: 'Customs Clearance',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered'
  };
  return map[status] || status;
}

function renderDashboard() {
  const user = getCurrentUser();
  const loggedOut = document.getElementById('loggedOutDashboard');
  const content = document.getElementById('dashboardContent');

  if (!user) {
    loggedOut.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  loggedOut.classList.add('hidden');
  content.classList.remove('hidden');
  document.getElementById('clientName').textContent = user.name;

  const all = getShipments().filter(s => s.userEmail === user.email);
  const inTransit = all.filter(s => !['delivered', 'created'].includes(s.status)).length;
  const delivered = all.filter(s => s.status === 'delivered').length;

  document.getElementById('totalShipments').textContent = all.length;
  document.getElementById('transitShipments').textContent = inTransit;
  document.getElementById('deliveredShipments').textContent = delivered;

  const list = document.getElementById('shipmentList');
  if (all.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:30px 0;">No shipments yet. Create your first one.</p>`;
    return;
  }

  list.innerHTML = all.map(s => `
    <div class="shipment-item" onclick="openShipmentModal('${s.tracking}')">
      <div>
        <div class="code">${s.tracking}</div>
        <div class="meta">${s.senderLocation} → ${s.receiverLocation} • ${s.description}</div>
      </div>
      <span class="status-badge \( {s.status}"> \){getStatusLabel(s.status)}</span>
    </div>
  `).join('');
}

// ---------- TRACKING ----------
function trackShipment() {
  const code = document.getElementById('trackingInput').value.trim().toUpperCase();
  const result = document.getElementById('trackingResult');

  if (!code) {
    result.innerHTML = `<p style="color:var(--text-muted);text-align:center;">Enter a tracking number</p>`;
    return;
  }

  const shipment = getShipments().find(s => s.tracking === code);
  if (!shipment) {
    result.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:30px;text-align:center;">
        <h3 style="margin-bottom:8px;">No shipment found</h3>
        <p style="color:var(--text-muted);">Tracking number <strong>${code}</strong> does not exist in the system.</p>
      </div>`;
    return;
  }

  result.innerHTML = renderShipmentCard(shipment, true);
}

function renderShipmentCard(s, showAdvance = false) {
  const progressMap = {
    created: 10,
    picked_up: 30,
    in_transit: 55,
    customs: 70,
    out_for_delivery: 88,
    delivered: 100
  };

  const stages = [
    { key: 'created', label: 'Shipment Created' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'in_transit', label: 'In International Transit' },
    { key: 'customs', label: 'Customs Clearance' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const currentIndex = stages.findIndex(st => st.key === s.status);

  let timelineHTML = stages.map((st, i) => {
    let cls = '';
    if (i < currentIndex) cls = 'completed';
    if (i === currentIndex) cls = 'active';
    const hist = s.history.find(h => h.status === st.key);
    return `
      <div class="timeline-item ${cls}">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <strong>${st.label}</strong>
          <span>${hist ? new Date(hist.time).toLocaleString() : '—'}</span>
        </div>
      </div>`;
  }).join('');

  const advanceBtn = showAdvance && s.status !== 'delivered' ? `
    <button class="btn btn-primary" style="margin-top:20px;width:100%;" onclick="advanceStatus('${s.tracking}')">
      Advance to Next Stage
    </button>` : '';

  return `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div class="tracking-code" style="font-size:20px;">${s.tracking}</div>
        <span class="status-badge \( {s.status}"> \){getStatusLabel(s.status)}</span>
      </div>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">
        ${s.service} • ${s.weight} kg • Est. ${s.estimatedDelivery}
      </p>

      <div class="route" style="margin-bottom:16px;">
        <div><small>FROM</small><strong>${s.senderLocation}</strong></div>
        <div class="route-line">✈</div>
        <div><small>TO</small><strong>${s.receiverLocation}</strong></div>
      </div>

      <div class="progress"><div class="progress-bar" style="width:${progressMap[s.status] || 10}%"></div></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;font-size:14px;">
        <div><small style="color:var(--text-muted);">Sender</small><br>\( {s.senderName}<br> \){s.senderContact}</div>
        <div><small style="color:var(--text-muted);">Receiver</small><br>\( {s.receiverName}<br> \){s.receiverContact}</div>
      </div>

      <p style="font-size:14px;margin-bottom:8px;"><strong>Package:</strong> ${s.description}</p>

      <div class="timeline">${timelineHTML}</div>
      ${advanceBtn}
    </div>`;
}

function openShipmentModal(tracking) {
  const shipment = getShipments().find(s => s.tracking === tracking);
  if (!shipment) return;

  document.getElementById('modalContent').innerHTML = renderShipmentCard(shipment, true);
  document.getElementById('shipmentModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('shipmentModal').classList.add('hidden');
}

function advanceStatus(tracking) {
  const shipments = getShipments();
  const idx = shipments.findIndex(s => s.tracking === tracking);
  if (idx === -1) return;

  const order = ['created', 'picked_up', 'in_transit', 'customs', 'out_for_delivery', 'delivered'];
  const current = shipments[idx].status;
  const nextIndex = order.indexOf(current) + 1;
  if (nextIndex >= order.length) return;

  const next = order[nextIndex];
  shipments[idx].status = next;
  shipments[idx].history.push({
    status: next,
    label: getStatusLabel(next),
    time: new Date().toISOString()
  });

  saveShipments(shipments);
  showToast(`Status updated → ${getStatusLabel(next)}`);

  // Refresh views
  if (document.getElementById('shipmentModal').classList.contains('hidden') === false) {
    openShipmentModal(tracking);
  }
  if (document.getElementById('trackView').classList.contains('active')) {
    document.getElementById('trackingInput').value = tracking;
    trackShipment();
  }
  renderDashboard();
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  // Seed demo account
  let users = getUsers();
  if (!users.find(u => u.email === 'real@wavex.live')) {
    users.push({ name: 'Real Client', email: 'real@wavex.live', password: 'Real1234' });
    saveUsers(users);
  }

  updateNav();

  // If already logged in, stay ready
  if (getCurrentUser()) {
    // optional: auto show dashboard
  }
});
