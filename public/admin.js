const API_BASE = '/api/admin';
let isAuthenticated = false;
let currentSection = 'dashboard';
let prizes = [];
let indicators = [];
let coupons = [];
let spins = [];

// ======== LOGIN =========
async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      isAuthenticated = true;
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-section').style.display = 'block';
      await preloadData();
      loadSection('dashboard');
    } else {
      alert('Usuário ou senha incorretos.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao conectar ao servidor.');
  }
}

// ======== PRÉ-CARREGAMENTO DE DADOS =========
async function preloadData() {
  try {
    const [prizesRes, indRes, coupRes] = await Promise.all([
      fetch(`${API_BASE}/prizes`),
      fetch(`${API_BASE}/indicators`),
      fetch(`${API_BASE}/coupons`)
    ]);
    prizes = await prizesRes.json();
    indicators = await indRes.json();
    coupons = await coupRes.json();
  } catch (err) {
    console.warn('Falha ao carregar dados iniciais:', err);
  }
}

// ======== MENU LATERAL =========
function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('minimized');
}

document.getElementById('menu-dashboard').addEventListener('click', () => loadSection('dashboard'));
document.getElementById('menu-prizes').addEventListener('click', () => loadSection('prizes'));
document.getElementById('menu-indicators').addEventListener('click', () => loadSection('indicators'));
document.getElementById('menu-coupons').addEventListener('click', () => loadSection('coupons'));
document.getElementById('menu-spins').addEventListener('click', () => loadSection('spins'));

// ======== CARREGAR SEÇÃO =========
async function loadSection(section) {
  if (!isAuthenticated) return;

  document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
  document.getElementById(`menu-${section}`).classList.add('active');
  document.getElementById('section-title').innerText =
    section === 'dashboard' ? '📊 Estatísticas' :
    section === 'prizes' ? '🎁 Prêmios' :
    section === 'indicators' ? '👤 Indicadores' :
    section === 'coupons' ? '🎫 Cupons' :
    '🔄 Giros';

  const content = document.getElementById('section-content');
  content.innerHTML = '<p>Carregando...</p>';
  currentSection = section;

  if (section === 'dashboard') renderDashboard();
  if (section === 'prizes') await renderPrizes();
  if (section === 'indicators') await renderIndicators();
  if (section === 'coupons') await renderCoupons();
  if (section === 'spins') await renderSpins();
}

// ======== RENDER DASHBOARD =========
function renderDashboard() {
  const content = document.getElementById('section-content');
  content.innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;">
      <div style="flex:1;min-width:250px;background:rgba(255,255,255,0.05);padding:20px;border-radius:10px;">
        <h3>Indicadores</h3>
        <p><strong>${indicators.length}</strong> cadastrados</p>
      </div>
      <div style="flex:1;min-width:250px;background:rgba(255,255,255,0.05);padding:20px;border-radius:10px;">
        <h3>Cupons</h3>
        <p><strong>${coupons.length}</strong> gerados</p>
      </div>
      <div style="flex:1;min-width:250px;background:rgba(255,255,255,0.05);padding:20px;border-radius:10px;">
        <h3>Prêmios</h3>
        <p><strong>${prizes.length}</strong> disponíveis</p>
      </div>
    </div>
  `;
}

// ======== RENDER PRÊMIOS =========
async function renderPrizes() {
  const res = await fetch(`${API_BASE}/prizes`);
  prizes = await res.json();

  const content = document.getElementById('section-content');
  content.innerHTML = `
    <h3>Lista de Prêmios</h3>
    <button onclick="addPrize()" style="margin:10px 0;">+ Adicionar Prêmio</button>
    <table>
      <tr><th>ID</th><th>Título</th><th>Nível</th><th>Ações</th></tr>
      ${prizes.map(p => `
        <tr>
          <td>${p.id}</td>
          <td>${p.title}</td>
          <td>Nível ${p.level}</td>
          <td class="actions">
            <button onclick="deletePrize(${p.id})">Excluir</button>
          </td>
        </tr>`).join('')}
    </table>
  `;
}

async function addPrize() {
  const title = prompt('Título do prêmio:');
  if (!title) return;
  const level = prompt('Nível do prêmio (1-4):');
  if (!level) return;
  await fetch(`${API_BASE}/prizes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, level: parseInt(level) })
  });
  await preloadData();
  loadSection('prizes');
}

async function deletePrize(id) {
  if (!confirm('Excluir este prêmio?')) return;
  await fetch(`${API_BASE}/prizes/${id}`, { method: 'DELETE' });
  await preloadData();
  loadSection('prizes');
}

// ======== RENDER INDICADORES =========
async function renderIndicators() {
  const res = await fetch(`${API_BASE}/indicators`);
  indicators = await res.json();

  const content = document.getElementById('section-content');
  content.innerHTML = `
    <h3>Indicadores</h3>
    <button onclick="addIndicator()" style="margin:10px 0;">+ Adicionar Indicador</button>
    <table>
      <tr><th>ID</th><th>Nome</th><th>Indicações</th><th>Ações</th></tr>
      ${indicators.map(i => `
        <tr>
          <td>${i.id}</td>
          <td>${i.name}</td>
          <td>${i.referrals || 0}</td>
          <td class="actions">
            <button onclick="generateCoupon(${i.id})">Gerar Cupom</button>
            <button onclick="deleteIndicator(${i.id})">Excluir</button>
          </td>
        </tr>`).join('')}
    </table>
  `;
}

async function addIndicator() {
  const name = prompt('Nome do indicador:');
  if (!name) return;
  await fetch(`${API_BASE}/indicators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  await preloadData();
  loadSection('indicators');
}

async function deleteIndicator(id) {
  if (!confirm('Excluir este indicador e seus cupons?')) return;
  await fetch(`${API_BASE}/indicators/${id}`, { method: 'DELETE' });
  await preloadData();
  loadSection('indicators');
}

async function generateCoupon(id) {
  await fetch(`${API_BASE}/coupons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ indicatorId: id })
  });
  alert('Cupom gerado com sucesso!');
  await preloadData();
  loadSection('indicators');
}

// ======== RENDER CUPONS =========
async function renderCoupons() {
  const res = await fetch(`${API_BASE}/coupons`);
  coupons = await res.json();

  const content = document.getElementById('section-content');
  content.innerHTML = `
    <h3>Cupons</h3>
    <table>
      <tr><th>ID</th><th>Indicador</th><th>Código</th><th>Nível</th><th>Prêmio</th><th>Status</th></tr>
      ${coupons.map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${c.indicator_name}</td>
          <td>${c.code}</td>
          <td>Nível ${c.level}</td>
          <td>${c.prize_title || '-'}</td>
          <td>${c.used ? 'Resgatado' : 'Pendente'}</td>
        </tr>`).join('')}
    </table>
  `;
}

// ======== RENDER HISTÓRICO DE GIROS =========
async function renderSpins() {
  const res = await fetch(`${API_BASE}/spins`);
  spins = await res.json();

  const content = document.getElementById('section-content');
  content.innerHTML = `
    <h3>Histórico de Giros</h3>
    <table>
      <tr><th>ID</th><th>Cupom</th><th>Prêmio</th><th>Data</th></tr>
      ${spins.map(s => `
        <tr>
          <td>${s.id}</td>
          <td>${s.coupon_code}</td>
          <td>${s.prize_title}</td>
          <td>${s.date}</td>
        </tr>`).join('')}
    </table>
  `;
}
