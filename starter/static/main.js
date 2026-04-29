// Timer variables
let timerInterval = null;
let timerSeconds = 0;

function startTimer() {
  stopTimer();
  timerSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const timerDiv = document.getElementById('timer');
  if (timerDiv) {
    const mm = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const ss = String(timerSeconds % 60).padStart(2, '0');
    timerDiv.textContent = `Time: ${mm}:${ss}`;
  }
}

function getSavedTheme() {
  return localStorage.getItem('sudokuTheme') || 'light';
}

function setTheme(mode) {
  const body = document.body;
  body.classList.toggle('dark', mode === 'dark');
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = mode === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
  localStorage.setItem('sudokuTheme', mode);
}

function toggleTheme() {
  const current = getSavedTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function isBoardComplete() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const inp = inputs[idx];
      if (inp.disabled) continue; // prefilled or hinted
      const userVal = parseInt(inp.value) || 0;
      if (userVal !== solution[i][j]) {
        return false;
      }
    }
  }
  return true;
}

function loadScores() {
  try {
    const scores = localStorage.getItem('sudokuScores');
    return scores ? JSON.parse(scores) : [];
  } catch (e) {
    console.error('Error loading scores:', e);
    return [];
  }
}

function saveScores(scores) {
  localStorage.setItem('sudokuScores', JSON.stringify(scores));
}

function addScore(name, time, difficulty) {
  const scores = loadScores();
  scores.push({ name, time, difficulty, hintsUsed });
  scores.sort((a, b) => a.time - b.time);
  const top10 = scores.slice(0, 10);
  saveScores(top10);
}

function displayScores() {
  const scores = loadScores();
  const scoreList = document.getElementById('score-list');
  scoreList.innerHTML = '';
  scores.forEach((score, index) => {
    const li = document.createElement('li');
    const mm = String(Math.floor(score.time / 60)).padStart(2, '0');
    const ss = String(score.time % 60).padStart(2, '0');
    let hintsText = (score.hintsUsed !== undefined ? ` Hints: ${score.hintsUsed}` : (score.hints !== undefined ? ` Hints: ${score.hints}` : ""));
    li.textContent = `${index + 1}. ${score.name} - ${mm}:${ss}${hintsText} (${score.difficulty})`;
    scoreList.appendChild(li);
  });
}
// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let hintsUsed = 0;
let puzzle = [];
let solution = [];
let currentDifficulty = 'medium';

function createBoardElement() {
  console.log('Creating board element');
  const boardDiv = document.getElementById('sudoku-board');
  console.log('Board div:', boardDiv);
  if (!boardDiv) {
    console.error('Sudoku board div not found');
    return;
  }
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        if (isBoardComplete()) {
          const name = prompt('Congratulations! Puzzle solved! Enter your name for the scoreboard:');
          if (name) {
            addScore(name, timerSeconds, currentDifficulty);
            displayScores();
          }
          document.getElementById('message').innerText = 'Congratulations! Puzzle solved!';
          document.getElementById('message').style.color = '#388e3c';
          stopTimer();
        }
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz, sol) {
  console.log('Rendering puzzle', puz, sol);
  puzzle = puz;
  solution = sol;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  console.log('Starting new game');
  hintsUsed = 0;
  currentDifficulty = document.getElementById('difficulty').value;
  const res = await fetch(`/new?difficulty=${currentDifficulty}`);
  const data = await res.json();
  renderPuzzle(data.puzzle, data.solution);
  document.getElementById('message').innerText = '';
  startTimer();
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
    stopTimer();
    // Prompt for name and save score
    const name = prompt('Congratulations! Puzzle solved! Enter your name for the scoreboard:');
    if (name) {
      addScore(name, timerSeconds, currentDifficulty);
      displayScores();
    }
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

function hint() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const emptyCells = [];
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      if (!inputs[idx].disabled && inputs[idx].value === '') {
        emptyCells.push({i, j, idx});
      }
    }
  }
  if (emptyCells.length > 0) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const {i, j, idx} = randomCell;
    // Safeguard: check if solution is defined and has the correct structure
    if (solution && Array.isArray(solution) && solution[i] && typeof solution[i][j] !== 'undefined') {
      inputs[idx].value = solution[i][j];
      inputs[idx].disabled = true;
      inputs[idx].className = 'sudoku-cell prefilled';
      hintsUsed++;
    } else {
      alert('Solution not loaded. Please start a new game.');
    }
  }
}

function check() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const inp = inputs[idx];
      if (inp.disabled) continue;
      const userVal = parseInt(inp.value) || 0;
      inp.className = 'sudoku-cell';
      if (userVal !== 0 && userVal !== solution[i][j]) {
        inp.className = 'sudoku-cell incorrect';
      }
    }
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('hint').addEventListener('click', hint);
  document.getElementById('check').addEventListener('click', check);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  displayScores();
  setTheme(getSavedTheme());
  // initialize
  newGame();
  startTimer();
});