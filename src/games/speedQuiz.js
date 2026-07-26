// Mini Game 3: 10 짝꿍 스피드 퀴즈 (Speed Flash 10)
import { soundManager } from '../audio/soundManager.js';
import { spawnStarPop, spawnConfetti } from '../utils/confetti.js';

export class SpeedQuizGame {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.timer = 25;
    this.timerInterval = null;
    this.score = 0;
    this.goldEarned = 0;
    this.totalQuestions = 0;
    this.correctAnswers = 0;
    this.streak = 1;
    this.maxStreak = 1;
    this.currentQuestion = null;
  }

  start() {
    this.renderLayout();
    this.nextQuestion();
    this.startTimer();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="game-card speed-game-card">
        <div class="game-header">
          <div class="game-header-nav">
            <button class="back-to-lobby-btn" id="speed-back-lobby-top">🏠 로비로 돌아가기</button>
            <div class="game-title-badge">⚡ 10 짝꿍 스피드 퀴즈</div>
          </div>
          <div class="game-stats">
            <div class="stat-pill timer-pill">⏱️ <span id="speed-timer">25</span>초</div>
            <div class="stat-pill score-pill">⭐ <span id="speed-score">0</span>점</div>
            <div class="stat-pill gold-pill">🪙 +<span id="speed-gold">0</span></div>
          </div>
        </div>

        <div class="game-instruction">
          빈칸 <strong>[ ? ]</strong> 에 들어갈 정답을 빠르게 선택하세요!
        </div>

        <div class="combo-banner" id="speed-streak-banner">연속 정답 x1!</div>

        <!-- Question Card -->
        <div class="quiz-question-box" id="quiz-question-box">
          <div class="quiz-expression" id="quiz-expression">? + ? = 10</div>
        </div>

        <!-- 4 Option Buttons -->
        <div class="quiz-options-grid" id="quiz-options-grid"></div>

        <button class="btn btn-secondary quit-btn" id="speed-quit-btn">🏠 게임 나가기 (로비로)</button>
      </div>
    `;

    const handleExit = () => {
      soundManager.playPop();
      this.stop();
      this.onComplete(0, 0);
    };

    document.getElementById('speed-back-lobby-top').addEventListener('click', handleExit);
    document.getElementById('speed-quit-btn').addEventListener('click', handleExit);
  }

  generateQuestion() {
    const types = ['add_right', 'add_left', 'sub_right', 'triple_add'];
    const type = types[Math.floor(Math.random() * types.length)];

    let expressionText = '';
    let correctAnswer = 0;

    if (type === 'add_right') {
      const a = Math.floor(Math.random() * 9) + 1;
      correctAnswer = 10 - a;
      expressionText = `${a} + <span class="blank-box">?</span> = 10`;
    } else if (type === 'add_left') {
      const b = Math.floor(Math.random() * 9) + 1;
      correctAnswer = 10 - b;
      expressionText = `<span class="blank-box">?</span> + ${b} = 10`;
    } else if (type === 'sub_right') {
      const total = Math.floor(Math.random() * 8) + 11;
      correctAnswer = total - 10;
      expressionText = `${total} - <span class="blank-box">?</span> = 10`;
    } else {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * (9 - a)) + 1;
      correctAnswer = 10 - (a + b);
      expressionText = `${a} + ${b} + <span class="blank-box">?</span> = 10`;
    }

    const optionsSet = new Set([correctAnswer]);
    while (optionsSet.size < 4) {
      let dummy = correctAnswer + (Math.floor(Math.random() * 7) - 3);
      if (dummy > 0 && dummy !== correctAnswer && dummy <= 20) {
        optionsSet.add(dummy);
      }
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return { expressionText, correctAnswer, options };
  }

  nextQuestion() {
    this.currentQuestion = this.generateQuestion();
    const exprElem = document.getElementById('quiz-expression');
    const optionsGrid = document.getElementById('quiz-options-grid');

    if (exprElem) exprElem.innerHTML = this.currentQuestion.expressionText;

    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      this.currentQuestion.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.innerText = opt;
        btn.addEventListener('click', (e) => this.handleOptionClick(opt, btn, e));
        optionsGrid.appendChild(btn);
      });
    }
  }

  handleOptionClick(chosenOpt, btnElem, event) {
    this.totalQuestions++;
    const isCorrect = (chosenOpt === this.currentQuestion.correctAnswer);

    if (isCorrect) {
      soundManager.playSuccess();
      const rect = btnElem.getBoundingClientRect();
      spawnStarPop(rect.left + rect.width / 2, rect.top, document.body);

      btnElem.classList.add('opt-correct');

      this.correctAnswers++;
      const addedScore = 150 * this.streak;
      const addedGold = 15 + (this.streak > 1 ? 5 : 0);

      this.score += addedScore;
      this.goldEarned += addedGold;
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      this.updateUI();

      setTimeout(() => {
        this.nextQuestion();
      }, 250);

    } else {
      soundManager.playWrong();
      btnElem.classList.add('opt-wrong');

      this.streak = 1;
      this.updateUI();

      setTimeout(() => {
        btnElem.classList.remove('opt-wrong');
        this.nextQuestion();
      }, 400);
    }
  }

  updateUI() {
    const scoreElem = document.getElementById('speed-score');
    const goldElem = document.getElementById('speed-gold');
    const streakElem = document.getElementById('speed-streak-banner');

    if (scoreElem) scoreElem.innerText = this.score;
    if (goldElem) goldElem.innerText = this.goldEarned;
    if (streakElem) {
      streakElem.innerText = `연속 정답 x${this.streak}!`;
      streakElem.classList.add('bounce');
      setTimeout(() => streakElem.classList.remove('bounce'), 300);
    }
  }

  startTimer() {
    const timerElem = document.getElementById('speed-timer');
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

    const accuracy = this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 0;

    this.container.innerHTML = `
      <div class="game-card result-card">
        <div class="result-header">
          <div class="result-badge">🎉 25초 종료!</div>
          <h2>10 짝꿍 스피드 퀴즈 완료!</h2>
        </div>

        <div class="result-stats">
          <div class="result-stat-box">
            <span class="label">맞힌 문제</span>
            <span class="value">${this.correctAnswers} / ${this.totalQuestions}문항</span>
          </div>
          <div class="result-stat-box">
            <span class="label">정답률</span>
            <span class="value">${accuracy}%</span>
          </div>
          <div class="result-stat-box highlight">
            <span class="label">획득 골드</span>
            <span class="value">🪙 +${this.goldEarned} Gold</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary" id="speed-restart-btn">🔄 다시 도전</button>
          <button class="btn btn-success" id="speed-finish-btn">🏠 로비로 돌아가기</button>
        </div>
      </div>
    `;

    document.getElementById('speed-restart-btn').addEventListener('click', () => {
      soundManager.playPop();
      this.start();
    });

    document.getElementById('speed-finish-btn').addEventListener('click', () => {
      soundManager.playPop();
      this.onComplete(this.score, this.goldEarned);
    });
  }
}
