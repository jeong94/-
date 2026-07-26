// Mini Game 2: 10 짝꿍 블록 맞추기 (Block Match 10)
import { soundManager } from '../audio/soundManager.js';
import { spawnStarPop, spawnConfetti } from '../utils/confetti.js';

export class BlockMatchGame {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.timer = 25;
    this.timerInterval = null;
    this.score = 0;
    this.goldEarned = 0;
    this.blocksCleared = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.grid = [];
    this.selectedBlock = null;
  }

  start() {
    this.renderLayout();
    this.initGrid();
    this.startTimer();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="game-card block-game-card">
        <div class="game-header">
          <div class="game-header-nav">
            <button class="back-to-lobby-btn" id="block-back-lobby-top">🏠 로비로 돌아가기</button>
            <div class="game-title-badge">🧩 10 짝꿍 블록 맞추기</div>
          </div>
          <div class="game-stats">
            <div class="stat-pill timer-pill">⏱️ <span id="block-timer">25</span>초</div>
            <div class="stat-pill score-pill">⭐ <span id="block-score">0</span>점</div>
            <div class="stat-pill gold-pill">🪙 +<span id="block-gold">0</span></div>
          </div>
        </div>

        <div class="game-instruction">
          합해서 <strong>10</strong>이 되는 블록 2개를 선택해 파괴해보세요!
        </div>

        <div class="combo-banner" id="block-combo-banner">콤보 x1!</div>

        <!-- 4x4 Grid Container -->
        <div class="block-grid" id="block-grid"></div>

        <button class="btn btn-secondary quit-btn" id="block-quit-btn">🏠 게임 나가기 (로비로)</button>
      </div>
    `;

    const handleExit = () => {
      soundManager.playPop();
      this.stop();
      this.onComplete(0, 0);
    };

    document.getElementById('block-back-lobby-top').addEventListener('click', handleExit);
    document.getElementById('block-quit-btn').addEventListener('click', handleExit);
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < 4; r++) {
      this.grid[r] = [];
      for (let c = 0; c < 4; c++) {
        this.grid[r][c] = this.getRandomNumber();
      }
    }
    this.ensureValidPairs();
    this.renderGrid();
  }

  getRandomNumber() {
    return Math.floor(Math.random() * 9) + 1;
  }

  ensureValidPairs() {
    this.grid[0][0] = 3; this.grid[0][1] = 7;
    this.grid[2][2] = 4; this.grid[2][3] = 6;
  }

  renderGrid() {
    const gridElem = document.getElementById('block-grid');
    if (!gridElem) return;
    gridElem.innerHTML = '';

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        const blockElem = document.createElement('div');
        blockElem.className = `block-cell block-val-${val}`;
        blockElem.dataset.r = r;
        blockElem.dataset.c = c;
        blockElem.dataset.val = val;
        
        blockElem.innerHTML = `
          <span class="block-num">${val}</span>
        `;

        if (this.selectedBlock && this.selectedBlock.r === r && this.selectedBlock.c === c) {
          blockElem.classList.add('selected');
        }

        blockElem.addEventListener('click', (e) => this.handleBlockClick(r, c, val, blockElem, e));
        gridElem.appendChild(blockElem);
      }
    }
  }

  handleBlockClick(r, c, val, elem, event) {
    soundManager.playPop();

    if (this.selectedBlock && this.selectedBlock.r === r && this.selectedBlock.c === c) {
      this.selectedBlock = null;
      elem.classList.remove('selected');
      return;
    }

    if (!this.selectedBlock) {
      this.selectedBlock = { r, c, val, elem };
      elem.classList.add('selected');
    } else {
      const prev = this.selectedBlock;
      if (prev.val + val === 10) {
        soundManager.playSuccess();
        const rect = elem.getBoundingClientRect();
        spawnStarPop(rect.left + rect.width / 2, rect.top, document.body);

        elem.classList.add('block-pop-success');
        prev.elem.classList.add('block-pop-success');

        this.blocksCleared += 2;
        const addedScore = 120 * this.combo;
        const addedGold = 12 + (this.combo > 1 ? 6 : 0);

        this.score += addedScore;
        this.goldEarned += addedGold;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        this.updateUI();

        setTimeout(() => {
          this.grid[prev.r][prev.c] = null;
          this.grid[r][c] = null;
          this.selectedBlock = null;

          this.applyGravity();
          this.renderGrid();
        }, 300);

      } else {
        soundManager.playWrong();
        elem.classList.add('block-pop-wrong');
        prev.elem.classList.add('block-pop-wrong');

        this.combo = 1;
        this.updateUI();

        setTimeout(() => {
          elem.classList.remove('selected', 'block-pop-wrong');
          prev.elem.classList.remove('selected', 'block-pop-wrong');
          this.selectedBlock = null;
        }, 400);
      }
    }
  }

  applyGravity() {
    for (let c = 0; c < 4; c++) {
      let emptySlots = 0;
      for (let r = 3; r >= 0; r--) {
        if (this.grid[r][c] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          this.grid[r + emptySlots][c] = this.grid[r][c];
          this.grid[r][c] = null;
        }
      }
      for (let r = 0; r < emptySlots; r++) {
        this.grid[r][c] = this.getRandomNumber();
      }
    }
  }

  updateUI() {
    const scoreElem = document.getElementById('block-score');
    const goldElem = document.getElementById('block-gold');
    const comboElem = document.getElementById('block-combo-banner');

    if (scoreElem) scoreElem.innerText = this.score;
    if (goldElem) goldElem.innerText = this.goldEarned;
    if (comboElem) {
      comboElem.innerText = `콤보 x${this.combo}!`;
      comboElem.classList.add('bounce');
      setTimeout(() => comboElem.classList.remove('bounce'), 300);
    }
  }

  startTimer() {
    const timerElem = document.getElementById('block-timer');
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (timerElem) timerElem.innerText = this.timer;

      if (this.timer <= 0) {
        this.finishGame();
      }
    }, 1000);
  }

  stop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  finishGame() {
    this.stop();
    soundManager.playVictory();
    spawnConfetti(this.container, 50);

    this.container.innerHTML = `
      <div class="game-card result-card">
        <div class="result-header">
          <div class="result-badge">🎉 25초 종료!</div>
          <h2>10 짝꿍 블록 클리어!</h2>
        </div>

        <div class="result-stats">
          <div class="result-stat-box">
            <span class="label">파괴한 블록</span>
            <span class="value">${this.blocksCleared}개</span>
          </div>
          <div class="result-stat-box">
            <span class="label">최대 콤보</span>
            <span class="value">${this.maxCombo} Combo</span>
          </div>
          <div class="result-stat-box highlight">
            <span class="label">획득 골드</span>
            <span class="value">🪙 +${this.goldEarned} Gold</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary" id="block-restart-btn">🔄 다시 도전</button>
          <button class="btn btn-success" id="block-finish-btn">🏠 로비로 돌아가기</button>
        </div>
      </div>
    `;

    document.getElementById('block-restart-btn').addEventListener('click', () => {
      soundManager.playPop();
      this.start();
    });

    document.getElementById('block-finish-btn').addEventListener('click', () => {
      soundManager.playPop();
      this.onComplete(this.score, this.goldEarned);
    });
  }
}
