// ======================= ROLETA.JS COMPATÍVEL =========================
console.log("🎯 Script da roleta carregado");

const API_PUBLIC = '/api/prizes';
const API_SPIN = '/api/spin';

let premios = [];
let girando = false;

// Função para carregar os prêmios do servidor
async function carregarPremios() {
  console.log("🔄 Carregando prêmios...");
  try {
    const res = await fetch(API_PUBLIC);
    console.log("📡 Status:", res.status);
    if (!res.ok) throw new Error(`Erro ao buscar prêmios (${res.status})`);
    premios = await res.json();
    console.log("📦 Prêmios recebidos:", premios);
    if (!Array.isArray(premios) || premios.length === 0) {
      document.getElementById("mensagem").innerText = "⚠️ Nenhum prêmio disponível.";
      return;
    }
    desenharRoleta();
  } catch (err) {
    console.error("❌ Erro ao carregar prêmios:", err);
    document.getElementById("mensagem").innerText = "Erro ao carregar prêmios.";
  }
}

// Função para desenhar a roleta
function desenharRoleta() {
  const canvas = document.getElementById("roleta");
  const ctx = canvas.getContext("2d");
  const numSetores = premios.length;
  const anguloSetor = (2 * Math.PI) / numSetores;
  const raio = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  premios.forEach((premio, i) => {
    const anguloInicio = i * anguloSetor;
    const anguloFim = anguloInicio + anguloSetor;

    // Cores alternadas
    ctx.fillStyle = i % 2 === 0 ? "#6a00ff" : "#b000ff";
    ctx.beginPath();
    ctx.moveTo(raio, raio);
    ctx.arc(raio, raio, raio, anguloInicio, anguloFim);
    ctx.fill();
    ctx.save();

    // Texto
    ctx.translate(raio, raio);
    ctx.rotate(anguloInicio + anguloSetor / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Poppins";
    ctx.fillText(premio.title || premio.nome || `Prêmio ${i + 1}`, raio - 10, 5);
    ctx.restore();
  });

  console.log(`✅ Roleta desenhada com ${numSetores} prêmios`);
}

// Função de giro
async function girarRoleta() {
  if (girando) return;
  const cupom = document.getElementById("cupom").value.trim();
  if (!cupom) {
    alert("Digite seu cupom antes de girar!");
    return;
  }
  girando = true;
  document.getElementById("mensagem").innerText = "🎡 Girando...";

  try {
    const res = await fetch(API_SPIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon: cupom }),
    });

    console.log("📍 Resposta giro:", res.status);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro no giro");

    console.log("🏆 Resultado:", data);
    const premio = premios.find((p) => p.id === data.prize_id) || premios[0];
    const indexPremio = premios.indexOf(premio);
    const anguloSetor = (2 * Math.PI) / premios.length;
    const rotacaoFinal = (Math.PI * 10) + (Math.PI * 2 - indexPremio * anguloSetor - anguloSetor / 2);

    const canvas = document.getElementById("roleta");
    const ctx = canvas.getContext("2d");

    let anguloAtual = 0;
    const duracao = 5000;
    const inicio = performance.now();

    function animarRoleta(tempo) {
      const progresso = Math.min((tempo - inicio) / duracao, 1);
      anguloAtual = rotacaoFinal * easeOutCubic(progresso);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(anguloAtual);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      desenharRoleta();
      ctx.restore();
      if (progresso < 1) {
        requestAnimationFrame(animarRoleta);
      } else {
        document.getElementById("mensagem").innerText = `🏅 Você ganhou: ${premio.title || premio.nome}!`;
        girando = false;
      }
    }

    requestAnimationFrame(animarRoleta);
  } catch (err) {
    console.error("❌ Erro ao girar roleta:", err);
    document.getElementById("mensagem").innerText = "Erro ao girar roleta.";
    girando = false;
  }
}

// Função de easing para suavizar a rotação
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  carregarPremios();
  const btn = document.getElementById("btnGirar");
  if (btn) btn.addEventListener("click", girarRoleta);
});
