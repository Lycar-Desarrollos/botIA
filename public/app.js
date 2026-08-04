// ============================================================
// 🤖 PANEL DE CONTROL APP - CHIP RENT A CAR
// ============================================================

let currentLeads = [];
let currentConfig = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

// Setup All UI Event Listeners
function setupEventListeners() {
  // Login form submit
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Logout button
  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  // Refresh button
  document.getElementById('btn-refresh').addEventListener('click', loadDashboardData);

  // Navigation Tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // View All Leads button from Dashboard
  document.getElementById('btn-view-all-leads')?.addEventListener('click', () => {
    switchTab('leads');
  });

  // Search & Filter Leads
  document.getElementById('search-lead')?.addEventListener('input', renderLeadsTable);
  document.getElementById('filter-status')?.addEventListener('change', renderLeadsTable);

  // Export CSV
  document.getElementById('btn-export-csv')?.addEventListener('click', exportLeadsCSV);

  // Pricing Forms
  document.getElementById('form-prices-cars')?.addEventListener('submit', handleSaveCarPrices);
  document.getElementById('form-prices-insurance')?.addEventListener('submit', handleSaveInsurancePrices);

  // Modal Close
  document.getElementById('btn-close-modal')?.addEventListener('click', closeLeadModal);
  document.getElementById('btn-modal-close-footer')?.addEventListener('click', closeLeadModal);

  // Bot Restart
  document.getElementById('btn-restart-bot')?.addEventListener('click', restartBot);
}

// ------------------------------------------------------------
// 🔐 AUTHENTICATION
// ------------------------------------------------------------

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (data.authenticated) {
      showAppScreen(data.user);
    } else {
      showLoginScreen();
    }
  } catch (err) {
    showLoginScreen();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('username').value;
  const passwordInput = document.getElementById('password').value;
  const errorAlert = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  const btnLogin = document.getElementById('btn-login');

  errorAlert.classList.add('hidden');
  btnLogin.disabled = true;
  btnLogin.querySelector('span').textContent = 'Ingresando...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showAppScreen(data.username);
    } else {
      errorMsg.textContent = data.message || 'Usuario o contraseña incorrectos';
      errorAlert.classList.remove('hidden');
    }
  } catch (err) {
    errorMsg.textContent = 'Error al conectar con el servidor';
    errorAlert.classList.remove('hidden');
  } finally {
    btnLogin.disabled = false;
    btnLogin.querySelector('span').textContent = 'Iniciar Sesión';
  }
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  showLoginScreen();
}

let statusInterval = null;

function showLoginScreen() {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function showAppScreen(username) {
  document.getElementById('user-display-name').textContent = username || 'Admin';
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  loadDashboardData();

  if (!statusInterval) {
    statusInterval = setInterval(fetchBotStatus, 3000);
  }
}

// ------------------------------------------------------------
// 📊 DATA LOADING & TABS
// ------------------------------------------------------------

function switchTab(tabName) {
  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  // Update tab page visibility
  document.querySelectorAll('.tab-page').forEach(page => {
    page.classList.toggle('active', page.id === `tab-${tabName}`);
  });

  // Update page header title
  const titleMap = {
    'dashboard': { title: 'Dashboard Principal', sub: 'Resumen de operaciones y clientes en tiempo real' },
    'leads': { title: 'Gestión de Reservas', sub: 'Lista completa de leads capturados por el bot' },
    'prices': { title: 'Tarifas y Precios', sub: 'Edición de costos de renta y seguros' },
    'bot-status': { title: 'Estado de WhatsApp', sub: 'Monitoreo de conexión y sesión Baileys' }
  };

  if (titleMap[tabName]) {
    document.getElementById('page-title').textContent = titleMap[tabName].title;
    document.getElementById('page-subtitle').textContent = titleMap[tabName].sub;
  }
}

async function loadDashboardData() {
  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) refreshBtn.classList.add('fa-spin');

  await Promise.all([
    fetchLeads(),
    fetchBotStatus(),
    fetchConfig()
  ]);

  if (refreshBtn) refreshBtn.classList.remove('fa-spin');
}

// ------------------------------------------------------------
// 📋 LEADS & STATS MANAGEMENT
// ------------------------------------------------------------

async function fetchLeads() {
  try {
    const res = await fetch('/api/leads');
    if (!res.ok) return;
    currentLeads = await res.json();

    // Sort newest first
    currentLeads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    updateStats();
    renderRecentLeadsTable();
    renderLeadsTable();
  } catch (err) {
    console.error('Error cargando leads:', err);
  }
}

function updateStats() {
  // Total count
  const totalLeads = currentLeads.length;
  document.getElementById('stat-total-leads').textContent = totalLeads;
  document.getElementById('badge-leads-count').textContent = totalLeads;

  // Calculate estimated total revenue
  let totalRevenue = 0;
  const carCounts = {};

  currentLeads.forEach(l => {
    // Parse totalFinal numeric value
    if (l.totalFinal) {
      const val = parseInt(l.totalFinal.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(val)) totalRevenue += val;
    }
    // Count popular car
    if (l.auto) {
      carCounts[l.auto] = (carCounts[l.auto] || 0) + 1;
    }
  });

  document.getElementById('stat-estimated-revenue').textContent = `$${totalRevenue.toLocaleString()} MXN`;

  // Popular car
  let popularCar = '-';
  let maxCount = 0;
  for (const [car, count] of Object.entries(carCounts)) {
    if (count > maxCount) {
      maxCount = count;
      popularCar = car.split('(')[0].trim();
    }
  }
  document.getElementById('stat-popular-car').textContent = popularCar;
}

function renderRecentLeadsTable() {
  const tbody = document.getElementById('recent-leads-table-body');
  const recent = currentLeads.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-muted">No hay reservas registradas aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(lead => {
    const fecha = lead.timestamp ? new Date(lead.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : 'Hoy';
    const status = lead.status || 'Pendiente';
    return `
      <tr>
        <td><strong>${fecha}</strong></td>
        <td><strong>${escapeHtml(lead.nombre || 'Anónimo')}</strong></td>
        <td>${escapeHtml(lead.auto || '-')}</td>
        <td>${escapeHtml(lead.fechaInicio || '-')} → ${escapeHtml(lead.fechaFin || '-')}</td>
        <td>${lead.dias || 1} día(s)</td>
        <td><strong>${lead.totalFinal || '-'}</strong></td>
        <td>${renderStatusBadge(status)}</td>
      </tr>
    `;
  }).join('');
}

function renderLeadsTable() {
  const tbody = document.getElementById('full-leads-table-body');
  const searchVal = document.getElementById('search-lead').value.toLowerCase().trim();
  const filterVal = document.getElementById('filter-status').value;

  let filtered = currentLeads.filter(lead => {
    const status = lead.status || 'Pendiente';
    const matchesStatus = filterVal === 'all' || status === filterVal;
    
    const searchTarget = `${lead.nombre || ''} ${lead.telefono || ''} ${lead.auto || ''}`.toLowerCase();
    const matchesSearch = !searchVal || searchTarget.includes(searchVal);

    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-muted">No se encontraron reservas con esos filtros.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((lead, index) => {
    const fechaStr = lead.timestamp ? new Date(lead.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
    const status = lead.status || 'Pendiente';

    return `
      <tr>
        <td><small class="text-muted">${fechaStr}</small></td>
        <td><strong>${escapeHtml(lead.nombre || 'Anónimo')}</strong></td>
        <td><a href="https://wa.me/${cleanPhone(lead.telefono)}" target="_blank" class="btn-link"><i class="fa-brands fa-whatsapp text-emerald"></i> ${escapeHtml(lead.telefono || '-')}</a></td>
        <td>${escapeHtml(lead.auto || '-')}</td>
        <td><small>${escapeHtml(lead.fechaInicio || '')} al ${escapeHtml(lead.fechaFin || '')}</small></td>
        <td><small>${lead.fullCover ? '💎 Full Cover' : '🛡️ Amplio 10%'}</small></td>
        <td><strong>${lead.totalFinal || '-'}</strong></td>
        <td>
          <select class="form-select form-select-sm" onchange="updateLeadStatus('${lead.timestamp}', this.value)">
            <option value="Pendiente" ${status === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
            <option value="Contactado" ${status === 'Contactado' ? 'selected' : ''}>📞 Contactado</option>
            <option value="Confirmado" ${status === 'Confirmado' ? 'selected' : ''}>✅ Confirmado</option>
            <option value="Cancelado" ${status === 'Cancelado' ? 'selected' : ''}>❌ Cancelado</option>
          </select>
        </td>
        <td>
          <button class="btn-icon" onclick="viewLeadDetail('${lead.timestamp}')" title="Ver detalles"><i class="fa-solid fa-eye"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderStatusBadge(status) {
  const classMap = {
    'Pendiente': 'badge-pendiente',
    'Contactado': 'badge-contactado',
    'Confirmado': 'badge-confirmado',
    'Cancelado': 'badge-cancelado'
  };
  return `<span class="badge-status ${classMap[status] || 'badge-pendiente'}">${status}</span>`;
}

async function updateLeadStatus(timestamp, newStatus) {
  try {
    const res = await fetch('/api/leads/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp, status: newStatus })
    });
    if (res.ok) {
      const lead = currentLeads.find(l => l.timestamp === timestamp);
      if (lead) lead.status = newStatus;
      updateStats();
      renderRecentLeadsTable();
    }
  } catch (err) {
    console.error('Error actualizando estado:', err);
  }
}

function viewLeadDetail(timestamp) {
  const lead = currentLeads.find(l => l.timestamp === timestamp);
  if (!lead) return;

  const modalBody = document.getElementById('modal-lead-body');
  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <div><strong>👤 Cliente:</strong> ${escapeHtml(lead.nombre || 'No especificado')}</div>
      <div><strong>📞 Teléfono:</strong> ${escapeHtml(lead.telefono || '-')}</div>
      <div><strong>🚗 Auto solicitado:</strong> ${escapeHtml(lead.auto || '-')}</div>
      <div><strong>📅 Periodo de renta:</strong> ${escapeHtml(lead.fechaInicio || '-')} → ${escapeHtml(lead.fechaFin || '-')} (${lead.dias || 1} días)</div>
      <div><strong>🛡️ Cobertura:</strong> ${lead.fullCover ? 'Full Cover (0% deducible)' : 'Seguro amplio incluido (10% deducible)'}</div>
      <div><strong>💰 Total Renta:</strong> ${lead.totalRenta || '-'}</div>
      <div><strong>🛡️ Total Seguro:</strong> ${lead.totalSeguro || '-'}</div>
      <div style="font-size: 1.1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;"><strong>💵 Total General:</strong> <span style="color: var(--color-success);">${lead.totalFinal || '-'}</span></div>
    </div>
  `;

  document.getElementById('modal-lead-detail').classList.remove('hidden');
}

function closeLeadModal() {
  document.getElementById('modal-lead-detail').classList.add('hidden');
}

function exportLeadsCSV() {
  if (currentLeads.length === 0) return alert('No hay datos para exportar');

  const headers = ['Fecha', 'Nombre', 'Telefono', 'Auto', 'FechaInicio', 'FechaFin', 'Dias', 'TotalFinal', 'Estado'];
  const rows = currentLeads.map(l => [
    l.timestamp || '',
    `"${(l.nombre || '').replace(/"/g, '""')}"`,
    `"${(l.telefono || '').replace(/"/g, '""')}"`,
    `"${(l.auto || '').replace(/"/g, '""')}"`,
    l.fechaInicio || '',
    l.fechaFin || '',
    l.dias || 1,
    `"${(l.totalFinal || '').replace(/"/g, '""')}"`,
    l.status || 'Pendiente'
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `reservas_chip_rentacar_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ------------------------------------------------------------
// 🚗 PRICING MANAGEMENT
// ------------------------------------------------------------

async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    currentConfig = await res.json();
    renderPriceForms();
  } catch (err) {
    console.error('Error cargando configuración:', err);
  }
}

function renderPriceForms() {
  if (!currentConfig) return;

  // Car daily prices
  const carsContainer = document.getElementById('cars-price-list');
  carsContainer.innerHTML = currentConfig.autos.map((item, idx) => `
    <div class="price-input-row">
      <label>${escapeHtml(item.tipo)}</label>
      <input type="text" name="car_${idx}" value="${escapeHtml(item.precioDia)}" required>
    </div>
  `).join('');

  // Insurance prices
  const insContainer = document.getElementById('insurance-price-list');
  insContainer.innerHTML = currentConfig.seguros.map((item, idx) => `
    <div class="price-input-row">
      <label>${escapeHtml(item.tipo)}</label>
      <input type="text" name="ins_${idx}" value="${escapeHtml(item.precioDia)}" required>
    </div>
  `).join('');
}

async function handleSaveCarPrices(e) {
  e.preventDefault();
  const form = e.target;
  const newAutos = currentConfig.autos.map((item, idx) => {
    const val = form[`car_${idx}`].value.trim();
    return { ...item, precioDia: val };
  });

  await saveConfigPartial({ autos: newAutos });
}

async function handleSaveInsurancePrices(e) {
  e.preventDefault();
  const form = e.target;
  const newSeguros = currentConfig.seguros.map((item, idx) => {
    const val = form[`ins_${idx}`].value.trim();
    return { ...item, precioDia: val };
  });

  await saveConfigPartial({ seguros: newSeguros });
}

async function saveConfigPartial(partial) {
  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial)
    });
    if (res.ok) {
      currentConfig = await res.json();
      renderPriceForms();
      alert('✅ Precios actualizados correctamente');
    }
  } catch (err) {
    alert('❌ Error guardando precios');
  }
}

// ------------------------------------------------------------
// 📱 BOT STATUS MONITOR
// ------------------------------------------------------------

async function fetchBotStatus() {
  try {
    const res = await fetch('/api/bot/status');
    if (!res.ok) return;
    const status = await res.json();

    const isConnected = status.connected;
    const qrDataUrl = status.qr;
    
    // Quick badge in top header
    const quickBadge = document.getElementById('bot-quick-status');
    const statusText = document.getElementById('bot-status-text');
    const statusDot = document.getElementById('bot-status-indicator');

    const dashQrBanner = document.getElementById('dashboard-qr-banner');
    const dashQrImgBox = document.getElementById('dash-qr-img-box');
    const qrContainer = document.getElementById('qr-container');
    const qrCodeImg = document.getElementById('qr-code-img');

    if (isConnected) {
      quickBadge.className = 'bot-quick-badge';
      statusText.textContent = 'WhatsApp Online';
      statusDot.className = 'status-dot online';

      document.getElementById('stat-bot-connection').textContent = 'Online';
      document.getElementById('stat-bot-detail').textContent = 'Conectado y listo';
      document.getElementById('stat-bot-detail').className = 'stat-trend positive';

      document.getElementById('bot-status-big-icon').className = 'status-big-badge online';
      document.getElementById('bot-status-big-title').textContent = 'WhatsApp Conectado';
      document.getElementById('bot-status-big-desc').textContent = 'El bot está respondiendo mensajes activamente.';

      if (dashQrBanner) dashQrBanner.classList.add('hidden');
      if (qrContainer) qrContainer.classList.add('hidden');
    } else {
      quickBadge.className = 'bot-quick-badge offline';
      statusText.textContent = 'WhatsApp Offline';
      statusDot.className = 'status-dot offline';

      document.getElementById('stat-bot-connection').textContent = 'Offline';
      document.getElementById('stat-bot-detail').textContent = 'Escanea el QR abajo';
      document.getElementById('stat-bot-detail').className = 'stat-trend';

      document.getElementById('bot-status-big-icon').className = 'status-big-badge offline';
      document.getElementById('bot-status-big-title').textContent = 'WhatsApp Desconectado';
      document.getElementById('bot-status-big-desc').textContent = 'Escanea el código QR con WhatsApp en tu iPhone para vincular el dispositivo.';

      if (qrDataUrl) {
        const qrHtml = `<img src="${qrDataUrl}" alt="Código QR WhatsApp" style="max-width: 280px; border-radius: 12px; background: white; padding: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">`;
        
        if (dashQrBanner) {
          dashQrBanner.classList.remove('hidden');
          if (dashQrImgBox) dashQrImgBox.innerHTML = qrHtml;
        }
        if (qrContainer) {
          qrContainer.classList.remove('hidden');
          if (qrCodeImg) qrCodeImg.innerHTML = qrHtml;
        }
      } else {
        if (dashQrImgBox) dashQrImgBox.innerHTML = `<p class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Generando código QR...</p>`;
        if (qrCodeImg) qrCodeImg.innerHTML = `<p class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Generando código QR...</p>`;
      }
    }
  } catch (err) {
    console.error('Error obteniendo estado del bot:', err);
  }
}

async function restartBot() {
  if (!confirm('¿Deseas reiniciar la conexión del bot de WhatsApp?')) return;
  try {
    await fetch('/api/bot/restart', { method: 'POST' });
    fetchBotStatus();
  } catch (err) {
    alert('Error al enviar la señal de reinicio.');
  }
}

// Helpers
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function cleanPhone(phone) {
  return String(phone).replace(/[^0-9]/g, '');
}
