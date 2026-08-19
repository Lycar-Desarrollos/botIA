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

  // Modal Close & Delete
  document.getElementById('btn-close-modal')?.addEventListener('click', closeLeadModal);
  document.getElementById('btn-modal-close-footer')?.addEventListener('click', closeLeadModal);
  document.getElementById('btn-modal-delete-lead')?.addEventListener('click', () => {
    if (currentViewingLeadTimestamp) {
      deleteLead(currentViewingLeadTimestamp);
      closeLeadModal();
    }
  });

  // Metrics Period Filter Selector
  document.getElementById('select-metrics-period')?.addEventListener('change', updateStats);

  // Bot Restart & Logout
  document.getElementById('btn-restart-bot')?.addEventListener('click', restartBot);
  document.getElementById('btn-reset-whatsapp')?.addEventListener('click', logoutWhatsAppSession);

  // Excluded Contacts Form
  document.getElementById('form-add-excluded')?.addEventListener('submit', handleAddExcludedContact);

  // Quote Generator Actions
  document.getElementById('btn-autofill-quote')?.addEventListener('click', handleAutofillQuote);
  document.getElementById('form-quote-generator')?.addEventListener('submit', handlePrintQuote);
  document.getElementById('btn-print-quote')?.addEventListener('click', handlePrintQuote);
  document.getElementById('btn-preview-quote')?.addEventListener('click', handlePreviewQuote);
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
let dashboardAutoRefreshTimer = null;

function setRefreshInterval(ms) {
  localStorage.setItem('dashboard_refresh_interval', ms);
  if (dashboardAutoRefreshTimer) {
    clearInterval(dashboardAutoRefreshTimer);
    dashboardAutoRefreshTimer = null;
  }
  if (ms > 0) {
    dashboardAutoRefreshTimer = setInterval(loadDashboardData, ms);
  }
}

function showLoginScreen() {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
  if (dashboardAutoRefreshTimer) {
    clearInterval(dashboardAutoRefreshTimer);
    dashboardAutoRefreshTimer = null;
  }
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function showAppScreen(username) {
  document.getElementById('user-display-name').textContent = username || 'Admin';
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  loadDashboardData();

  const savedMs = parseInt(localStorage.getItem('dashboard_refresh_interval') || '5000', 10);
  setRefreshInterval(savedMs);

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
    'excluded-contacts': { title: 'Contactos Personales', sub: 'Números excluidos para los cuales el bot guarda silencio' },
    'quotes': { title: 'Cotizador & Formato Oficial', sub: 'Generador de cotizaciones e impresión de formato reservación' },
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
    fetchConfig(),
    fetchExcludedContacts()
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
    populateQuoteLeadDropdown();
  } catch (err) {
    console.error('Error cargando leads:', err);
  }
}

function updateStats() {
  const period = document.getElementById('select-metrics-period')?.value || 'todo';
  const now = new Date();

  // Filtrar leads según el periodo seleccionado
  const leadsFiltrados = currentLeads.filter(lead => {
    if (period === 'todo') return true;
    if (!lead.timestamp) return true;
    const fechaLead = new Date(lead.timestamp);

    if (period === 'hoy') {
      return fechaLead.toDateString() === now.toDateString();
    }
    if (period === '7dias') {
      const hace7Dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return fechaLead >= hace7Dias;
    }
    if (period === 'mes') {
      return fechaLead.getMonth() === now.getMonth() && fechaLead.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Total count
  const totalLeads = leadsFiltrados.length;
  document.getElementById('stat-total-leads').textContent = totalLeads;
  document.getElementById('badge-leads-count').textContent = currentLeads.length;

  // Calculate estimated total revenue
  let totalRevenue = 0;
  const carCounts = {};

  leadsFiltrados.forEach(l => {
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
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <button class="btn-icon" onclick="viewLeadDetail('${lead.timestamp}')" title="Ver detalles"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-icon" onclick="deleteLead('${lead.timestamp}')" title="Eliminar reserva" style="color: #f87171;"><i class="fa-solid fa-trash"></i></button>
          </div>
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

let currentViewingLeadTimestamp = null;

function viewLeadDetail(timestamp) {
  const lead = currentLeads.find(l => l.timestamp === timestamp);
  if (!lead) return;

  currentViewingLeadTimestamp = timestamp;
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
  currentViewingLeadTimestamp = null;
  document.getElementById('modal-lead-detail').classList.add('hidden');
}

async function deleteLead(timestamp) {
  const lead = currentLeads.find(l => l.timestamp === timestamp);
  const nombre = lead ? (lead.nombre || 'esta reserva') : 'esta reserva';
  if (!confirm(`¿Estás seguro de eliminar la reserva de "${nombre}"?\nEsta acción no se puede deshacer.`)) return;

  try {
    const res = await fetch(`/api/leads/${encodeURIComponent(timestamp)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentLeads = currentLeads.filter(l => l.timestamp !== timestamp);
      updateStats();
      renderRecentLeadsTable();
      renderLeadsTable();
    } else {
      alert('Error al eliminar la reserva.');
    }
  } catch (err) {
    alert('Error al conectar con el servidor.');
  }
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

      if (dashQrBanner) dashQrBanner.classList.remove('hidden');
      if (qrContainer) qrContainer.classList.remove('hidden');

      if (qrDataUrl) {
        const qrHtml = `<img src="${qrDataUrl}" alt="Código QR WhatsApp" style="max-width: 280px; border-radius: 12px; background: white; padding: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">`;
        if (dashQrImgBox) dashQrImgBox.innerHTML = qrHtml;
        if (qrCodeImg) qrCodeImg.innerHTML = qrHtml;
      } else {
        const loadingHtml = `<div style="padding: 1.5rem; background: rgba(0,0,0,0.3); border-radius: 12px; display: inline-block;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: #60a5fa;"></i><p class="text-muted mt-2" style="font-size: 0.9rem;">Generando código QR nuevo...</p></div>`;
        if (dashQrImgBox) dashQrImgBox.innerHTML = loadingHtml;
        if (qrCodeImg) qrCodeImg.innerHTML = loadingHtml;
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

async function logoutWhatsAppSession() {
  if (!confirm('¿Deseas desconectar WhatsApp y borrar la sesión actual?\nSe generará un código QR completamente nuevo.')) return;
  try {
    const res = await fetch('/api/bot/logout-whatsapp', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      fetchBotStatus();
    } else {
      alert('❌ Error al eliminar la sesión.');
    }
  } catch (err) {
    alert('❌ Error de conexión al servidor.');
  }
}

// ------------------------------------------------------------
// 🚫 CONTACTOS EXCLUIDOS (PERSONALES)
// ------------------------------------------------------------

let currentExcludedContacts = [];

async function fetchExcludedContacts() {
  try {
    const res = await fetch('/api/contactos-excluidos');
    if (!res.ok) return;
    currentExcludedContacts = await res.json();
    renderExcludedContactsTable();
  } catch (err) {
    console.error('Error cargando contactos excluidos:', err);
  }
}

function renderExcludedContactsTable() {
  const tbody = document.getElementById('excluded-contacts-table-body');
  if (!tbody) return;

  if (!currentExcludedContacts.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-muted">No hay contactos excluidos registrados. Todos los números son atendidos por el bot.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentExcludedContacts.map(c => {
    const tel = typeof c === 'object' ? (c.telefono || '') : c;
    const nombre = typeof c === 'object' ? (c.nombre || 'Contacto personal') : 'Personal';
    const nota = typeof c === 'object' ? (c.nota || '-') : '-';
    const fecha = typeof c === 'object' && c.fecha ? new Date(c.fecha).toLocaleDateString('es-MX') : '-';

    return `
      <tr>
        <td><strong>${escapeHtml(tel)}</strong></td>
        <td>${escapeHtml(nombre)}</td>
        <td><span class="badge" style="background: rgba(255,255,255,0.08);">${escapeHtml(nota)}</span></td>
        <td><small class="text-muted">${fecha}</small></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="handleDeleteExcludedContact('${escapeHtml(tel)}')" style="color: #fca5a5; border-color: rgba(239,68,68,0.3);">
            <i class="fa-solid fa-trash"></i> Eliminar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleAddExcludedContact(e) {
  e.preventDefault();
  const phoneInput = document.getElementById('excluded-phone-input');
  const nameInput = document.getElementById('excluded-name-input');
  const noteInput = document.getElementById('excluded-note-input');

  const telefono = phoneInput.value.trim();
  const nombre = nameInput.value.trim();
  const nota = noteInput.value.trim();

  if (!telefono) return;

  try {
    const res = await fetch('/api/contactos-excluidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono, nombre, nota })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      phoneInput.value = '';
      nameInput.value = '';
      noteInput.value = '';
      fetchExcludedContacts();
    } else {
      alert('Error al agregar contacto.');
    }
  } catch (err) {
    alert('Error al conectar con el servidor.');
  }
}

async function handleDeleteExcludedContact(telefono) {
  if (!confirm(`¿Eliminar ${telefono} de la lista de exclusión?\nEl bot volverá a responderle si escribe.`)) return;

  try {
    const res = await fetch(`/api/contactos-excluidos/${encodeURIComponent(telefono)}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchExcludedContacts();
    } else {
      alert('Error al eliminar contacto.');
    }
  } catch (err) {
    alert('Error al conectar con el servidor.');
  }
}

// ------------------------------------------------------------
// 📄 COTIZADOR & GENERADOR DE FORMATO OFICIAL (CLON RESERVACION)
// ------------------------------------------------------------

function populateQuoteLeadDropdown() {
  const select = document.getElementById('select-lead-quote');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = `<option value="">-- Seleccionar cliente / lead (${currentLeads.length}) --</option>` +
    currentLeads.map(l => {
      const nom = escapeHtml(l.nombre || 'Sin nombre');
      const tel = escapeHtml(l.telefono || '');
      const auto = escapeHtml(l.auto || '');
      return `<option value="${l.timestamp}">${nom} - ${auto} (${tel})</option>`;
    }).join('');

  if (currentVal) select.value = currentVal;
}

function handleAutofillQuote() {
  const select = document.getElementById('select-lead-quote');
  if (!select || !select.value) return alert('Por favor selecciona una reserva registrada.');

  const lead = currentLeads.find(l => l.timestamp === select.value);
  if (!lead) return;

  if (lead.nombre) document.getElementById('q-nombre').value = lead.nombre.toUpperCase();
  if (lead.telefono) document.getElementById('q-telefono').value = lead.telefono;
  if (lead.auto) document.getElementById('q-vehiculo').value = lead.auto.toUpperCase();
  if (lead.fechaInicio) document.getElementById('q-fecha-entrega').value = lead.fechaInicio;
  if (lead.fechaFin) document.getElementById('q-fecha-devolucion').value = lead.fechaFin;
  if (lead.dias) document.getElementById('q-dias').value = lead.dias;
  if (lead.precioAutoDia) {
    const p = parseInt(lead.precioAutoDia.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(p)) document.getElementById('q-tarifa-dia').value = p;
  }
  if (lead.totalFinal) document.getElementById('q-total').value = lead.totalFinal.replace(/[^0-9,]/g, '');
  if (lead.fullCover) {
    document.getElementById('q-deducible').value = '0 % FULL COVER';
    document.getElementById('q-cobertura-total').value = lead.totalSeguro || 'INCLUIDO';
  } else {
    document.getElementById('q-deducible').value = '10 % SEGURO BASICO';
    document.getElementById('q-cobertura-total').value = 'N/A';
  }
}

function getQuoteFormData() {
  return {
    folio: document.getElementById('q-folio')?.value || '1000133',
    fechaEntrega: document.getElementById('q-fecha-entrega')?.value || '30-01-2026 10:00 AM',
    fechaDevolucion: document.getElementById('q-fecha-devolucion')?.value || '02-02-2026 05:00 PM',
    nombre: (document.getElementById('q-nombre')?.value || 'QUIROZ FLORES JOSUE').toUpperCase(),
    direccion: (document.getElementById('q-direccion')?.value || 'C LA MINA 16').toUpperCase(),
    colonia: (document.getElementById('q-colonia')?.value || 'PBLO HUATECALCO').toUpperCase(),
    ciudad: (document.getElementById('q-ciudad')?.value || 'TLALTIZAPAN, MOR').toUpperCase(),
    cp: document.getElementById('q-cp')?.value || '62777',
    telefono: document.getElementById('q-telefono')?.value || '9991234567',
    licencia: (document.getElementById('q-licencia')?.value || 'C4900013643 - Venc: 24-02-2026 - MORELOS').toUpperCase(),
    hotel: (document.getElementById('q-hotel')?.value || '').toUpperCase(),
    vuelo: (document.getElementById('q-vuelo')?.value || '').toUpperCase(),
    vehiculo: (document.getElementById('q-vehiculo')?.value || 'SEDAN STD').toUpperCase(),
    color: (document.getElementById('q-color')?.value || '').toUpperCase(),
    placas: (document.getElementById('q-placas')?.value || '').toUpperCase(),
    tarifaDia: document.getElementById('q-tarifa-dia')?.value || '700',
    dias: document.getElementById('q-dias')?.value || '3',
    coberturaTotal: document.getElementById('q-cobertura-total')?.value || 'N/A',
    cargosAdicionales: document.getElementById('q-cargos-adicionales')?.value || 'N/A',
    deducible: (document.getElementById('q-deducible')?.value || '10 % SEGURO BASICO').toUpperCase(),
    deposito: document.getElementById('q-deposito')?.value || '0.0',
    total: document.getElementById('q-total')?.value || '2,100',
    rentadoEn: (document.getElementById('q-rentado-en')?.value || 'MERIDA APTO').toUpperCase(),
    entregadoEn: (document.getElementById('q-entregado-en')?.value || 'MERIDA APTO').toUpperCase(),
    formaPago: (document.getElementById('q-forma-pago')?.value || '').toUpperCase(),
    gasolina: document.getElementById('q-gasolina')?.value || '1/2',
    km: document.getElementById('q-km')?.value || '050',
  };
}

function handlePrintQuote(e) {
  if (e) e.preventDefault();
  const data = getQuoteFormData();
  const html = generateQuoteHTML(data);
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}

function handlePreviewQuote() {
  const data = getQuoteFormData();
  const html = generateQuoteHTML(data);
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

function generateQuoteHTML(d) {
  const needleMap = { 'E': -80, '1/4': -40, '1/2': 0, '3/4': 40, 'F': 80 };
  const needleAngle = needleMap[d.gasolina] !== undefined ? needleMap[d.gasolina] : 0;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>RESERVACION - CHIP RENT A CAR - FOLIO ${escapeHtml(d.folio)}</title>
  <style>
    @page { size: letter portrait; margin: 6mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; }
    body { background: white; color: black; padding: 8px; width: 100%; max-width: 800px; margin: 0 auto; }
    
    .header-table { width: 100%; margin-bottom: 4px; border-collapse: collapse; }
    .header-table td { vertical-align: top; }
    
    .logo-box { border: 2px solid #1e3a8a; padding: 4px 8px; text-align: center; display: inline-block; width: 230px; }
    .logo-chip { font-size: 30pt; font-weight: 900; color: #1d4ed8; letter-spacing: 1px; font-family: 'Arial Black', sans-serif; line-height: 1; }
    .logo-rent { font-size: 12pt; font-weight: 800; color: #dc2626; letter-spacing: 2px; }
    
    .company-title { font-size: 9.5pt; font-weight: bold; text-align: center; color: black; line-height: 1.3; }
    .folio-title { text-align: right; font-size: 13pt; font-weight: bold; color: #dc2626; }
    
    .contact-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 3px; margin-top: 4px; font-weight: bold; font-size: 8.5pt; }
    .reserva-badge { background: #1d4ed8; color: white; padding: 3px 18px; font-size: 12pt; font-weight: 900; border-radius: 3px; letter-spacing: 1px; }
    
    .insurance-header { font-size: 7.5pt; font-weight: bold; margin: 4px 0 6px 0; line-height: 1.2; text-transform: uppercase; }
    
    .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    .grid-table td { border: 1px solid black; padding: 3px 5px; vertical-align: top; font-size: 7.5pt; }
    .lbl { font-size: 6.5pt; font-weight: bold; color: #333; text-transform: uppercase; display: block; }
    .val { font-size: 8.5pt; font-weight: bold; color: black; margin-top: 1px; min-height: 12px; }
    
    .inspection-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; margin-bottom: 6px; }
    .gas-container { border: 1px solid black; padding: 4px; width: 180px; text-align: center; }
    .car-diagram-container { text-align: center; width: 380px; }
    
    .legal-text { font-size: 6.5pt; line-height: 1.25; margin-top: 6px; text-align: justify; }
    .pagare-box { font-size: 6.5pt; font-weight: bold; margin-top: 6px; border-top: 1px solid black; padding-top: 4px; }
    .sig-table { width: 100%; margin-top: 18px; border-collapse: collapse; }
    .sig-table td { width: 50%; text-align: center; font-size: 7pt; font-weight: bold; vertical-align: top; }
    .sig-line { border-top: 1px solid black; width: 85%; margin: 0 auto 3px auto; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td style="width: 32%;">
        <div class="logo-box">
          <div class="logo-chip">CHIP</div>
          <div class="logo-rent">RENT A CAR</div>
        </div>
      </td>
      <td style="width: 43%; text-align: center;">
        <div class="company-title">
          OSCAR LEON RODRIGUEZ<br>
          LERO780207191<br>
          CALLE 28 POR 23 Y 25 SN<br>
          COL. M. CRECENCIO REJON, MERIDA, YUCATAN
        </div>
      </td>
      <td style="width: 25%; text-align: right;">
        <div class="folio-title">FOLIO: ${escapeHtml(d.folio)}</div>
      </td>
    </tr>
  </table>

  <!-- CONTACT BAR & TITLE -->
  <div class="contact-bar">
    <div>
      📞 9995526896 | 9999588566 &nbsp;&nbsp;&nbsp;&nbsp; 📧 OSCARCALLIN1978@ICLOUD.COM
    </div>
    <div>📘 CHIP RENT A CAR</div>
    <div class="reserva-badge">RESERVACION</div>
  </div>

  <div class="insurance-header">
    EL SEGURO SOLO CUBRE YUCATAN, CAMPECHE Y QUINTANA ROO. INSURANCE ONLY COVERS YUCATAN, CAMPECHE AND QUINTANA ROO.
  </div>

  <!-- 2-COLUMN MAIN CONTRACT TABLE GRID -->
  <table class="grid-table">
    <tr>
      <!-- LEFT COLUMN: DATOS CLIENTE -->
      <td style="width: 50%; padding: 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td colspan="3"><span class="lbl">NOMBRE / NAME</span><div class="val">${escapeHtml(d.nombre)}</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">DIRECCION / ADDRESS</span><div class="val">${escapeHtml(d.direccion)}</div></td>
          </tr>
          <tr>
            <td style="width: 40%;"><span class="lbl">COLONIA</span><div class="val">${escapeHtml(d.colonia)}</div></td>
            <td style="width: 40%;"><span class="lbl">CIUDAD / CITY</span><div class="val">${escapeHtml(d.ciudad)}</div></td>
            <td style="width: 20%;"><span class="lbl">C. P.</span><div class="val">${escapeHtml(d.cp)}</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">TELEFONO / PHONE NUMBER / CORREO ELECTRONICO</span><div class="val">${escapeHtml(d.telefono)}</div></td>
          </tr>
          <tr>
            <td style="width: 35%;"><span class="lbl">LICENCIA N / LICENSE</span><div class="val">${escapeHtml(d.licencia)}</div></td>
            <td style="width: 30%;"><span class="lbl">VENCIMIENTO / EXP</span><div class="val">24-02-2026</div></td>
            <td style="width: 35%;"><span class="lbl">LUGAR DE EXPEDICION</span><div class="val">YUCATAN</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">LUGAR DE HOSPEDAJE / HOTEL NAME</span><div class="val">${escapeHtml(d.hotel)}</div></td>
          </tr>
          <tr>
            <td style="width: 60%;"><span class="lbl">FECHA DE VUELO PROGRAMADO</span><div class="val">${escapeHtml(d.vuelo)}</div></td>
            <td colspan="2" style="width: 40%;"><span class="lbl">AEROLÍNEA</span><div class="val">VOLARIS / VIVA</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">SEGUNDO CONDUCTOR / ADDITIONAL DRIVER</span><div class="val">-</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">DIRECCION / ADDRESS</span><div class="val">-</div></td>
          </tr>
          <tr>
            <td><span class="lbl">COLONIA</span><div class="val">-</div></td>
            <td><span class="lbl">CIUDAD</span><div class="val">-</div></td>
            <td><span class="lbl">C. P.</span><div class="val">-</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">TELEFONO</span><div class="val">-</div></td>
          </tr>
          <tr>
            <td><span class="lbl">LICENCIA NO.</span><div class="val">-</div></td>
            <td><span class="lbl">VENCIMIENTO</span><div class="val">-</div></td>
            <td><span class="lbl">LUGAR EXPEDICION</span><div class="val">-</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">TITULAR DE LA TARJETA</span><div class="val">-</div></td>
          </tr>
          <tr>
            <td colspan="3"><span class="lbl">NUMERO DE TARJETA</span><div class="val">**** **** **** ****</div></td>
          </tr>
          <tr>
            <td colspan="3">
              <span class="lbl">VENCIMIENTO / METODO DE PAGO</span>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px;">
                <span class="val">EFECTIVO / DEBITO</span>
                <span style="font-size: 7.5pt; font-weight: bold;">[VISA] [MasterCard] [AMEX] [Otro]</span>
              </div>
            </td>
          </tr>
        </table>
      </td>

      <!-- RIGHT COLUMN: DATOS VEHICULO Y RENTA -->
      <td style="width: 50%; padding: 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%;"><span class="lbl">VEHICULO / VEHICLE</span><div class="val">${escapeHtml(d.vehiculo)}</div></td>
            <td style="width: 50%;"><span class="lbl">TARIFA BASE POR DIA / DAILY RATE</span><div class="val">$ ${escapeHtml(d.tarifaDia)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">COLOR</span><div class="val">${escapeHtml(d.color)}</div></td>
            <td><span class="lbl">TOTAL DE DIAS / TOTAL DAYS</span><div class="val">${escapeHtml(d.dias)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">PLACAS / LICENSE PLATE</span><div class="val">${escapeHtml(d.placas)}</div></td>
            <td><span class="lbl">SUB-TOTAL</span><div class="val">$ ${escapeHtml(d.total)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">SERIE</span><div class="val">*******************</div></td>
            <td><span class="lbl">CARGO POR COBERTURA TOTAL</span><div class="val">$ ${escapeHtml(d.coberturaTotal)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">PASAJEROS</span><div class="val">5</div></td>
            <td><span class="lbl">CARGOS ADICIONALES</span><div class="val">$ ${escapeHtml(d.cargosAdicionales)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">FECHA Y HORA DE ENTREGA</span><div class="val">${escapeHtml(d.fechaEntrega)}</div></td>
            <td><span class="lbl">% DEDUCIBLE DE SEGURO</span><div class="val">${escapeHtml(d.deducible)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">FECHA Y HORA DE DEVOLUCION</span><div class="val">${escapeHtml(d.fechaDevolucion)}</div></td>
            <td><span class="lbl">DEPOSITO EN GARANTIA</span><div class="val">$ ${escapeHtml(d.deposito)}</div></td>
          </tr>
          <tr>
            <td rowspan="4">
              <span class="lbl">EN CASO DE CAMBIO VEHICULO</span>
              <div class="val">-</div>
              <span class="lbl" style="margin-top: 6px;">COLOR / PLACAS / SERIE</span>
              <div class="val">-</div>
            </td>
            <td><span class="lbl">TOTAL</span><div class="val" style="font-size: 11pt; color: #059669;">$ ${escapeHtml(d.total)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">VEHICULO RENTADO EN:</span><div class="val">${escapeHtml(d.rentadoEn)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">VEHICULO ENTREGADO EN:</span><div class="val">${escapeHtml(d.entregadoEn)}</div></td>
          </tr>
          <tr>
            <td><span class="lbl">FORMA DE PAGO</span><div class="val">${escapeHtml(d.formaPago || 'EFECTIVO / TRANSFERENCIA')}</div></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- DIAGRAMS ROW: GAS GAUGE & CAR DIAGRAM -->
  <div class="inspection-row">
    <!-- GAS GAUGE VECTOR -->
    <div class="gas-container">
      <svg width="150" height="75" viewBox="0 0 150 85">
        <path d="M 15 75 A 60 60 0 0 1 135 75" fill="none" stroke="black" stroke-width="2.5"/>
        <line x1="20" y1="75" x2="32" y2="75" stroke="black" stroke-width="2"/>
        <text x="10" y="78" font-size="11" font-weight="bold">E</text>
        <line x1="32" y1="36" x2="41" y2="44" stroke="black" stroke-width="1.5"/>
        <text x="20" y="30" font-size="9" font-weight="bold">1/4</text>
        <line x1="75" y1="16" x2="75" y2="28" stroke="black" stroke-width="2"/>
        <text x="66" y="12" font-size="10" font-weight="bold">1/2</text>
        <line x1="118" y1="36" x2="109" y2="44" stroke="black" stroke-width="1.5"/>
        <text x="120" y="30" font-size="9" font-weight="bold">3/4</text>
        <line x1="130" y1="75" x2="118" y2="75" stroke="black" stroke-width="2"/>
        <text x="136" y="78" font-size="11" font-weight="bold">F</text>
        <circle cx="75" cy="75" r="5" fill="black"/>
        <g transform="rotate(${needleAngle}, 75, 75)">
          <line x1="75" y1="75" x2="75" y2="22" stroke="#dc2626" stroke-width="3"/>
        </g>
      </svg>
      <div style="font-weight: bold; font-size: 8pt; margin-top: 2px;">NIVEL DE GASOLINA</div>
      <div style="border: 1px solid black; display: flex; align-items: center; justify-content: space-between; padding: 2px 6px; margin-top: 4px;">
        <span style="font-weight: bold; font-size: 8pt;">Km: ${escapeHtml(d.km)}</span>
      </div>
    </div>

    <!-- CAR DIAGRAM SCHEMA -->
    <div class="car-diagram-container">
      <svg width="360" height="110" viewBox="0 0 360 110">
        <g stroke="black" stroke-width="1.2" fill="none">
          <rect x="70" y="10" width="220" height="90" rx="20" stroke="black"/>
          <path d="M 120 15 C 130 35, 130 75, 120 95"/>
          <path d="M 240 15 C 230 35, 230 75, 240 95"/>
          <line x1="140" y1="15" x2="220" y2="15"/>
          <line x1="140" y1="95" x2="220" y2="95"/>
          <rect x="90" y="3" width="30" height="8" fill="black"/>
          <rect x="90" y="99" width="30" height="8" fill="black"/>
          <rect x="240" y="3" width="30" height="8" fill="black"/>
          <rect x="240" y="99" width="30" height="8" fill="black"/>
          <circle cx="80" cy="55" r="6" fill="#e2e8f0" stroke="black"/>
          <circle cx="280" cy="55" r="6" fill="#e2e8f0" stroke="black"/>
        </g>
      </svg>
      <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">DIAGRAMA DE INSPECCION Y ESTADO DEL VEHICULO</div>
    </div>
  </div>

  <!-- LEGAL TERMS & PAGARE FOOTER -->
  <div class="legal-text">
    Este vehículo no está autorizado a salir de la República Mexicana.<br>
    Si pasadas las 24 horas de la fecha y hora de la promesa de regreso de este vehículo, el ARRENDADOR no ha sido notificado de la intención de prorrogar el contrato por parte del arrendatario, se procederá por los medios legales en contra del mismo y hasta recuperar la propiedad.<br>
    El ARRENDATARIO es responsable por el pago de infracciones y retiro o pérdida de placas o documentos de circulación.
  </div>

  <div class="pagare-box">
    Por este pagaré me(nos) obligo(amos) a pagar incondicionalmente a la vista y a la orden de <b>OSCAR LEON RODRIGUEZ o CHIP RENT A CAR</b>, en cualquier parte que se requiera la cantidad de $ <u>${escapeHtml(d.total)}</u> (<u>${escapeHtml(d.total)} PESOS 00/100 M.N.</u>), a <u>${escapeHtml(d.fechaEntrega)}</u> en <u>MERIDA, YUCATAN</u>.
  </div>

  <div style="font-size: 6.5pt; margin-top: 4px;">
    RELEVO DE RESPONSABILIDAD POR COLISION pagando el 10% del valor comercial en concepto de deducible $ ____________ no cubre robo parcial, ni daños menores. No procede si el vehículo es manejado bajo la influencia de bebidas embriagantes y/o sustancias tóxicas.
  </div>

  <!-- SIGNATURES GRID -->
  <table class="sig-table">
    <tr>
      <td>
        <div class="sig-line"></div>
        ACEPTO (FIRMA ARRENDATARIO)
      </td>
      <td>
        <div class="sig-line"></div>
        POR AVAL (FIRMA AVAL)
      </td>
    </tr>
    <tr>
      <td style="padding-top: 12px;">
        <div class="sig-line"></div>
        ACEPTO DEDUCIBLE SEGURO
      </td>
      <td style="padding-top: 12px;">
        <div class="sig-line"></div>
        DECLINO COBERTURA ADICIONAL
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// Helpers
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function cleanPhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}
