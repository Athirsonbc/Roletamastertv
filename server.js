import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;
const DATA_DIR = './data';
const DATA_FILE = `${DATA_DIR}/data.json`;
const ADMIN_USER = { username: 'admin', password: 'Barbosa!00' }; // ✅ Usuário padrão

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    indicators: [],
    coupons: [],
    prizes: [],
    spins: []
  }, null, 2));
}

// ======== FUNÇÕES DE LEITURA E ESCRITA =========
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Erro ao ler banco de dados:', err);
    return { indicators: [], coupons: [], prizes: [], spins: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Erro ao salvar banco de dados:', err);
  }
}

// ======== LOGIN ADMIN =========
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    console.log('✅ Login bem-sucedido');
    return res.status(200).json({ success: true });
  }
  console.warn('⚠️ Tentativa de login incorreta');
  res.status(401).json({ error: 'Usuário ou senha incorretos' });
});

// ======== PRÊMIOS =========
app.get('/api/admin/prizes', (req, res) => {
  console.log('🔄 Carregando prêmios...');
  const data = readData();
  res.json(data.prizes);
});

app.post('/api/admin/prizes', (req, res) => {
  const data = readData();
  const { title, level } = req.body;
  const newPrize = { id: Date.now(), title, level };
  data.prizes.push(newPrize);
  writeData(data);
  console.log(`🎁 Novo prêmio adicionado: ${title} (Nível ${level})`);
  res.json(newPrize);
});

app.delete('/api/admin/prizes/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  data.prizes = data.prizes.filter(p => p.id !== id);
  writeData(data);
  console.log(`🗑️ Prêmio ${id} excluído`);
  res.json({ success: true });
});

// ======== INDICADORES =========
app.get('/api/admin/indicators', (req, res) => {
  const data = readData();
  res.json(data.indicators);
});

app.post('/api/admin/indicators', (req, res) => {
  const data = readData();
  const { name } = req.body;
  const newIndicator = { id: Date.now(), name, referrals: 0 };
  data.indicators.push(newIndicator);
  writeData(data);
  console.log(`👤 Novo indicador adicionado: ${name}`);
  res.json(newIndicator);
});

app.delete('/api/admin/indicators/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  data.indicators = data.indicators.filter(i => i.id !== id);
  data.coupons = data.coupons.filter(c => c.indicatorId !== id);
  writeData(data);
  console.log(`🗑️ Indicador ${id} e seus cupons foram removidos`);
  res.json({ success: true });
});

// ======== CUPONS =========
app.get('/api/admin/coupons', (req, res) => {
  const data = readData();
  const enriched = data.coupons.map(c => ({
    ...c,
    indicator_name: data.indicators.find(i => i.id === c.indicatorId)?.name || '-',
    prize_title: data.prizes.find(p => p.id === c.prizeId)?.title || null
  }));
  res.json(enriched);
});

app.post('/api/admin/coupons', (req, res) => {
  const data = readData();
  const { indicatorId } = req.body;
  const indicator = data.indicators.find(i => i.id === indicatorId);
  if (!indicator) return res.status(400).json({ error: 'Indicador não encontrado' });

  indicator.referrals += 1;
  const newLevel = Math.min(4, indicator.referrals);
  const newCoupon = {
    id: Date.now(),
    indicatorId,
    code: `CP${Date.now().toString().slice(-6)}`,
    level: newLevel,
    used: false,
    prizeId: null
  };

  data.coupons.push(newCoupon);
  writeData(data);
  console.log(`🎫 Novo cupom criado: ${newCoupon.code} (Nível ${newLevel})`);
  res.json(newCoupon);
});

// ======== HISTÓRICO DE GIROS =========
app.get('/api/admin/spins', (req, res) => {
  const data = readData();
  const enriched = data.spins.map(s => ({
    ...s,
    coupon_code: data.coupons.find(c => c.id === s.couponId)?.code || '-',
    prize_title: data.prizes.find(p => p.id === s.prizeId)?.title || '-'
  }));
  res.json(enriched);
});

// ======== ROTA PÚBLICA PARA ROLETA ========
app.get('/api/prizes', (req, res) => {
  console.log('🎯 Solicitando prêmios públicos...');
  try {
    const data = readData();
    res.json(data.prizes);
  } catch (err) {
    console.error('❌ Erro ao carregar prêmios públicos:', err);
    res.status(500).json({ message: 'Erro ao carregar prêmios públicos.' });
  }
});

// ======== ROLETA =========
app.post('/api/spin', (req, res) => {
  const { coupon } = req.body;
  const data = readData();

  console.log(`🎡 Giro solicitado com cupom: ${coupon}`);

  const c = data.coupons.find(cc => cc.code === coupon);
  if (!c) {
    console.warn('⚠️ Cupom inválido ou não encontrado');
    return res.status(400).json({ message: 'Cupom inválido' });
  }

  if (c.used) {
    console.warn('⚠️ Cupom já utilizado');
    return res.status(400).json({ message: 'Cupom já utilizado' });
  }

  const availablePrizes = data.prizes.filter(p => parseInt(p.level) === c.level);
  if (availablePrizes.length === 0) {
    console.warn(`⚠️ Nenhum prêmio disponível para o nível ${c.level}`);
    return res.status(400).json({ message: 'Nenhum prêmio disponível para este nível' });
  }

  const selectedPrize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
  c.used = true;
  c.prizeId = selectedPrize.id;

  const newSpin = {
    id: Date.now(),
    couponId: c.id,
    prizeId: selectedPrize.id,
    date: new Date().toLocaleString()
  };

  data.spins.push(newSpin);
  writeData(data);

  console.log(`🏆 Cupom ${c.code} ganhou o prêmio "${selectedPrize.title}" (Nível ${c.level})`);

  res.json({ prize_id: selectedPrize.id, prize_title: selectedPrize.title });
});

app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
