// Hall of Fame (명예의 전당) Component with Firestore Support
import { getGoldRankings, getClearRankings, getUserData, saveUserData } from '../utils/storage.js';
import { fetchGlobalGoldRankings, fetchGlobalClearRankings } from '../firebase/dbService.js';
import { soundManager } from '../audio/soundManager.js';

export class HallOfFame {
  constructor(container, onClose) {
    this.container = container;
    this.onClose = onClose;
    this.activeTab = 'gold'; // 'gold' | 'clear'
    this.globalGoldRankings = null;
    this.globalClearRankings = null;
  }

  async render() {
    const userData = getUserData();

    // Fetch from Firestore asynchronously
    try {
      this.globalGoldRankings = await fetchGlobalGoldRankings();
      this.globalClearRankings = await fetchGlobalClearRankings();
    } catch (e) {
      console.warn("Using local rankings fallback");
    }

    this.container.innerHTML = `
      <div class="hof-overlay" id="hof-overlay">
        <div class="hof-modal">
          <div class="hof-header">
            <h2>🏆 10 만들기 명예의 전당</h2>
            <button class="hof-close-btn" id="hof-close-btn">&times;</button>
          </div>

          <!-- User Nickname Settings Banner -->
          <div class="hof-profile-card">
            <div class="profile-avatar">👧👦</div>
            <div class="profile-info">
              <div class="profile-label">나의 랭킹 닉네임</div>
              <div class="nickname-edit-row">
                <input type="text" id="nickname-input" class="nickname-input" value="${userData.nickname}" maxlength="10" placeholder="닉네임 입력 (최대 10자)" />
                <button class="btn btn-sm btn-primary" id="save-nickname-btn">저장</button>
              </div>
            </div>
            <div class="profile-stats">
              <div>💰 보유 골드: <strong>${userData.gold} Gold</strong></div>
              <div>🎮 클리어 횟수: <strong>${userData.totalClears}회</strong></div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="hof-tabs">
            <button class="hof-tab-btn ${this.activeTab === 'gold' ? 'active' : ''}" id="tab-gold-btn">
              💰 골드 부자 Top 10
            </button>
            <button class="hof-tab-btn ${this.activeTab === 'clear' ? 'active' : ''}" id="tab-clear-btn">
              🏆 미니게임 클리어 왕 Top 10
            </button>
          </div>

          <!-- Ranking List Container -->
          <div class="hof-list-container" id="hof-list-container">
            ${this.renderRankingList(userData)}
          </div>

          <div class="hof-footer">
            <button class="btn btn-success" id="hof-bottom-close-btn">로비로 돌아가기</button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderRankingList(userData) {
    const isGoldTab = (this.activeTab === 'gold');
    let rankings = isGoldTab ? (this.globalGoldRankings || getGoldRankings()) : (this.globalClearRankings || getClearRankings());

    return `
      <div class="ranking-table">
        <div class="ranking-table-header">
          <div class="col-rank">순위</div>
          <div class="col-name">플레이어</div>
          <div class="col-score">${isGoldTab ? '보유 골드' : '클리어 횟수'}</div>
          <div class="col-date">달성일</div>
        </div>

        <div class="ranking-rows">
          ${rankings.map((item, idx) => {
            const rankNum = idx + 1;
            let rankBadge = `${rankNum}위`;
            if (rankNum === 1) rankBadge = '🥇 1위';
            else if (rankNum === 2) rankBadge = '🥈 2위';
            else if (rankNum === 3) rankBadge = '🥉 3위';

            const itemName = item.name || item.nickname || '익명';
            const isCurrentPlayer = (itemName === userData.nickname);

            return `
              <div class="ranking-row ${isCurrentPlayer ? 'current-player-row' : ''} rank-${rankNum}">
                <div class="col-rank"><span class="rank-pill">${rankBadge}</span></div>
                <div class="col-name">${itemName} ${isCurrentPlayer ? '🔑 (나)' : ''}</div>
                <div class="col-score">${isGoldTab ? `🪙 ${(item.gold || 0).toLocaleString()} Gold` : `🎮 ${item.clears || 0}회`}</div>
                <div class="col-date">${item.date || '2026-07-26'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  attachEvents() {
    const closeBtn = document.getElementById('hof-close-btn');
    const bottomCloseBtn = document.getElementById('hof-bottom-close-btn');
    const tabGoldBtn = document.getElementById('tab-gold-btn');
    const tabClearBtn = document.getElementById('tab-clear-btn');
    const saveNickBtn = document.getElementById('save-nickname-btn');

    const handleClose = () => {
      soundManager.playPop();
      this.onClose();
    };

    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (bottomCloseBtn) bottomCloseBtn.addEventListener('click', handleClose);

    if (tabGoldBtn) {
      tabGoldBtn.addEventListener('click', () => {
        soundManager.playPop();
        this.activeTab = 'gold';
        this.render();
      });
    }

    if (tabClearBtn) {
      tabClearBtn.addEventListener('click', () => {
        soundManager.playPop();
        this.activeTab = 'clear';
        this.render();
      });
    }

    if (saveNickBtn) {
      saveNickBtn.addEventListener('click', () => {
        const input = document.getElementById('nickname-input');
        if (input && input.value.trim()) {
          soundManager.playCoin();
          const userData = getUserData();
          userData.nickname = input.value.trim();
          saveUserData(userData);
          this.render();
        }
      });
    }
  }
}
