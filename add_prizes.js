import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join('.', 'data', 'data.json');

// checar existência
if (!fs.existsSync(DATA_PATH)) {
  console.error('Arquivo data.json não encontrado em ./data');
  process.exit(1);
}

// backup
const now = Date.now();
const backupPath = path.join('.', 'data', `data.json.bak.${now}`);
fs.copyFileSync(DATA_PATH, backupPath);
console.log('Backup criado em:', backupPath);

// ler arquivo
const raw = fs.readFileSync(DATA_PATH, 'utf8');
const db = JSON.parse(raw);

// função para criar id único
let base = Date.now();
const nextId = () => ++base;

// prêmios a adicionar (conforme sua tabela)
const novos = [
  // Nível 1 — 1 indicação (já existe "30 dias grátis")
  { id: nextId(), title: "10 dias bônus", level: 1 },
  { id: nextId(), title: "R$5 crédito", level: 1 },
  { id: nextId(), title: "Cupom 10% off 1 mês", level: 1 },

  // Nível 2 — 2 indicações
  { id: nextId(), title: "60 dias grátis", level: 2 },
  { id: nextId(), title: "20 dias bônus", level: 2 },
  { id: nextId(), title: "R$10 crédito", level: 2 },
  { id: nextId(), title: "Cupom 15% off plano trimestral 1 tela", level: 2 },

  // Nível 3 — 3 indicações
  { id: nextId(), title: "90 dias grátis", level: 3 },
  { id: nextId(), title: "30 dias bônus", level: 3 },
  { id: nextId(), title: "R$15 crédito", level: 3 },
  { id: nextId(), title: "Cupom 20% off plano anual 1 tela ou 2 telas", level: 3 },

  // Nível 4 — 4+ indicações
  { id: nextId(), title: "180 dias grátis", level: 4 },
  { id: nextId(), title: "Pix R$30", level: 4 },
  { id: nextId(), title: "Pix R$60", level: 4 },
  { id: nextId(), title: "Cupom 25% off plano anual ou 2 telas", level: 4 }
];

// evitar duplicação por title+level (se já existir, não adiciona)
const existKeys = new Set(db.prizes.map(p => `${p.title}::${p.level}`));

const toAdd = novos.filter(n => {
  const key = `${n.title}::${n.level}`;
  if (existKeys.has(key)) return false;
  existKeys.add(key);
  return true;
});

if (toAdd.length === 0) {
  console.log('Nenhum prêmio novo para adicionar (já existem todos).');
  process.exit(0);
}

// acrescentar e salvar
db.prizes = db.prizes.concat(toAdd);
fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), 'utf8');

console.log(`Adicionados ${toAdd.length} prêmios.`);
// listar o que foi adicionado
toAdd.forEach(p => console.log(`- [Nível ${p.level}] ${p.title} (id: ${p.id})`));
