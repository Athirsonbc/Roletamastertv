// ==================== Roleta.js (versão debugada) ====================
console.log("🔧 Roleta.js carregado");

const API_PUBLIC = '/api/prizes';
const API_SPIN = '/api/spin';

let prizes = [];
let spinning = false;

async function loadPrizes() {
  console.log("🔄 Solicitando prêmios em:", API_PUBLIC);
  try {
    const res = await fetch(API_PUBLIC);
    console.log("📍 Resposta do servidor (prêmios):", res.status);
    if (!res.ok) throw new Error(`Status HTTP ${res.status}`);
    prizes = await res.json();
    console.log("📦 Prêmios recebidos:", prizes);

    if (!Array.isArray(prizes) || prizes.length === 0) {
      document.getElementById('result-text').innerText = "⚠️ Nenhum prêmio disponível.";
      return;
    }

    renderWheel();
  } catch (err) {
    console.error("❌ Falha ao carregar prêmios:", err);
    document.getElementById('result-text').innerText = "Erro ao carregar prêmios: " + err.message;
  }
}

function renderWheel() {
  const wheel = document.getElementById('wheel');
  if (!wheel) {
    console.error("🔍 Elemento #wheel não encontrado!");
    return;
  }
  wheel.innerHTML = '';
  const count = prizes.length;
  const angle = 360 / count;

  prizes.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'slice';
    div.style.transform = `rotate(${i * angle}deg) skewY(${90 - angle}deg)`;
    div.innerHTML = `<span>${p.title} (Nível ${p.level})</span>`;
    wheel.appendChild(div);
  });
  console.log(`✅ Roleta renderizada com ${count} setores`);
}

async function spinWheel() {
  if (spinning) return;
  const code = document.getElementById('coupon-code').value.trim();
  if (!code) {
    alert("Digite o cupom primeiro!");
    return;
  }
  spinning = true;
  document.getElementById('result-text').innerText = "🎡 Girando...";

  try {
    const res = await fetch(API_SPIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon: code })
    });
    console.log("📍 Resposta giro:", res.status);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro no giro");

    console.log("🎁 Prêmio sorteado:", data);

    const prize = prizes.find(p => p.id === data.prize_id);
    if (!prize) throw new Error("Prêmio sorteado não presente localmente");

    const idx = prizes.indexOf(prize);
    const sliceAngle = 360 / prizes.length;
    const rotation = 360 * 5 + (360 - idx * sliceAngle - sliceAngle / 2);

    const wheel = document.getElementById('wheel');
    wheel.style.transition = "transform 6s cubic-bezier(0.25,1,0.5,1)";
    wheel.style.transform = `rotate(${rotation}deg)`;

    setTimeout(() => {
      document.getElementById('result-text').innerText = `🏆 Você ganhou: ${data.prize_title}`;
      spinning = false;
    }, 6200);

  } catch (err) {
    console.error("❌ Erro durante giro:", err);
    alert("Erro ao girar roleta: " + err.message);
    spinning = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPrizes();
  const btn = document.getElementById('spin-btn');
  if (btn) btn.addEventListener('click', spinWheel);
});
