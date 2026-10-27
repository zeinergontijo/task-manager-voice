// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'pt-BR';
recognition.interimResults = true;
recognition.continuous = false;

let userId = localStorage.getItem('userId');
let currentFilter = 'pendentes';

// Elementos do DOM
const micBtn = document.getElementById('micBtn');
const transcript = document.getElementById('transcript');
const status = document.getElementById('status');
const response = document.getElementById('response');
const tasksList = document.getElementById('tasksList');
const loginModal = document.getElementById('loginModal');
const emailInput = document.getElementById('emailInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const tabBtns = document.querySelectorAll('.tab-btn');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  if (!userId) {
    loginModal.classList.add('show');
  } else {
    loginModal.classList.remove('show');
    carregarTarefas();
  }

  setupEventListeners();
});

function setupEventListeners() {
  micBtn.addEventListener('click', toggleRecognition);
  loginBtn.addEventListener('click', handleLogin);
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  logoutBtn.addEventListener('click', handleLogout);

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      carregarTarefas();
    });
  });
}

function toggleRecognition() {
  if (micBtn.classList.contains('listening')) {
    recognition.stop();
  } else {
    transcript.textContent = '';
    response.classList.remove('show');
    status.textContent = 'Ouvindo...';
    recognition.start();
  }
}

// Web Speech API Events
recognition.onstart = () => {
  micBtn.classList.add('listening');
  status.textContent = 'Ouvindo...';
};

recognition.onresult = (event) => {
  let interimTranscript = '';
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcriptSegment = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      transcript.textContent += transcriptSegment + ' ';
    } else {
      interimTranscript += transcriptSegment;
    }
  }
  if (interimTranscript) {
    transcript.textContent = transcript.textContent + interimTranscript;
  }
};

recognition.onend = async () => {
  micBtn.classList.remove('listening');
  const comando = transcript.textContent.trim();

  if (comando) {
    status.textContent = 'Processando...';
    await enviarComando(comando);
  } else {
    status.textContent = '';
  }
};

recognition.onerror = (event) => {
  status.textContent = `Erro: ${event.error}`;
  micBtn.classList.remove('listening');
};

// Enviar comando para o servidor
async function enviarComando(comando) {
  try {
    const res = await fetch('/api/comando', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comando, userId })
    });

    const data = await res.json();

    if (res.ok) {
      response.textContent = data.resposta;
      response.classList.add('show', 'success');
      response.classList.remove('error');
      status.textContent = '';

      // Atualizar lista de tarefas
      setTimeout(() => carregarTarefas(), 500);
    } else {
      response.textContent = data.erro || 'Erro ao processar';
      response.classList.add('show', 'error');
      response.classList.remove('success');
    }
  } catch (error) {
    response.textContent = 'Erro ao conectar com o servidor';
    response.classList.add('show', 'error');
    console.error('Erro:', error);
  }
}

// Carregar tarefas
async function carregarTarefas() {
  try {
    const res = await fetch(`/api/tarefas/${userId}?filtro=${currentFilter}`);
    const data = await res.json();

    if (data.tarefas && data.tarefas.length > 0) {
      tasksList.innerHTML = data.tarefas
        .map(
          (task) => `
        <div class="task-item ${task.concluida ? 'completed' : ''}">
          <input
            type="checkbox"
            class="task-checkbox"
            ${task.concluida ? 'checked' : ''}
            onchange="toggleTask('${task.id}')"
          />
          <div class="task-content">
            <div class="task-title">${task.titulo}</div>
            <div class="task-date">${formatarData(task.criadoEm)}</div>
          </div>
          <button class="task-delete" onclick="deletarTarefaUI('${task.id}')">
            🗑️
          </button>
        </div>
      `
        )
        .join('');
    } else {
      tasksList.innerHTML =
        '<p class="empty-state">Nenhuma tarefa ' + currentFilter + '.</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar tarefas:', error);
  }
}

// Toggle tarefa
async function toggleTask(id) {
  try {
    await fetch(`/api/tarefas/${userId}/${id}/toggle`, {
      method: 'PATCH'
    });
    carregarTarefas();
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Deletar tarefa via UI
async function deletarTarefaUI(id) {
  if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
    try {
      await fetch(`/api/tarefas/${userId}/${id}`, {
        method: 'DELETE'
      });
      carregarTarefas();
    } catch (error) {
      console.error('Erro:', error);
    }
  }
}

// Login
async function handleLogin() {
  const email = emailInput.value.trim();
  if (!email) {
    alert('Por favor, digite um email');
    return;
  }

  // Usar email como userId (simplificado)
  userId = btoa(email); // Codificar para usar como ID
  localStorage.setItem('userId', userId);

  loginModal.classList.remove('show');
  carregarTarefas();
}

// Logout
function handleLogout() {
  localStorage.removeItem('userId');
  userId = null;
  emailInput.value = '';
  loginModal.classList.add('show');
  tasksList.innerHTML = '';
}

// Formatar data
function formatarData(data) {
  if (typeof data === 'object' && data.toDate) {
    data = data.toDate();
  }
  const date = new Date(data);
  const hoje = new Date();
  const diff = hoje - date;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (dias === 0) {
    return 'Hoje às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } else if (dias === 1) {
    return 'Ontem';
  } else if (dias < 7) {
    return `${dias} dias atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}

// Sincronizar com servidor em tempo real (opcional - para atualizações de outros dispositivos)
setInterval(() => {
  if (userId) {
    carregarTarefas();
  }
}, 10000); // A cada 10 segundos
