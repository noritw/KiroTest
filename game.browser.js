/* Browser build for direct file:// use. Generated from game.js without ES module exports. */
/**
 * Kiro Ghost Shooter
 * HTML5 Canvas + Vanilla JavaScript (ES2020+)
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

// ---------------------------------------------------------------------------
// KeyboardInput — tracks key states and provides event-driven input interface
// ---------------------------------------------------------------------------
const KeyboardInput = {
  /** @type {Set<string>} */
  keysDown: new Set(),
  /** @type {Set<string>} */
  keysPressed: new Set(),

  /** Register keydown / keyup event listeners */
  init() {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.key);
      this.keysPressed.add(e.key);
    });
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.key);
    });
  },

  /**
   * Returns true while the given key is held down.
   * @param {string} key
   * @returns {boolean}
   */
  isDown(key) {
    return this.keysDown.has(key);
  },

  /**
   * Returns true once per press; removes the key from the pressed set.
   * @param {string} key
   * @returns {boolean}
   */
  consumePressed(key) {
    if (this.keysPressed.has(key)) {
      this.keysPressed.delete(key);
      return true;
    }
    return false;
  },

  consumeAnyPressed() {
    if (this.keysPressed.size === 0) return false;
    this.keysPressed.clear();
    return true;
  },
};

// ---------------------------------------------------------------------------
// AudioManager — loads and plays sound effects; all errors silently handled
// ---------------------------------------------------------------------------
const AudioManager = {
  /** @type {HTMLAudioElement|null} */
  jumpSound: null,
  /** @type {HTMLAudioElement|null} */
  gameOverSound: null,
  /** @type {AudioContext|null} */
  musicContext: null,
  /** @type {HTMLAudioElement|null} */
  bgm: null,
  muted: false,

  /** Pre-load sound assets */
  init() {
    try {
      this.jumpSound = new Audio('assets/jump.wav');
    } catch (e) {
      // silently ignore
    }
    try {
      this.gameOverSound = null;
    } catch (e) {
      // silently ignore
    }
    try {
      this.bgm = new Audio('assets/bgm.mp3');
      this.bgm.loop = true;
      this.bgm.volume = 0.45;
    } catch (e) {
      // silently ignore
    }
  },

  /** Play jump.wav (rewind if already playing) */
  playJump() {
    if (this.muted) return;
    try {
      this.jumpSound.currentTime = 0;
      this.jumpSound.play();
    } catch (e) {
      // silently ignore
    }
  },

  _playTone(frequency, duration = 0.12, type = 'sine', volume = 0.14) {
    if (this.muted) return;
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = this.musicContext ?? new AudioContextCtor();
      this.musicContext = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      // silently ignore
    }
  },

  playShoot() {
    this._playTone(920, 0.09, 'square', 0.08);
  },

  playBulletHit() {
    this._playTone(260, 0.11, 'sawtooth', 0.11);
  },

  playGhostHit() {
    this._playTone(120, 0.18, 'triangle', 0.16);
  },

  playHeal() {
    this._playTone(740, 0.15, 'sine', 0.12);
    setTimeout(() => this._playTone(980, 0.12, 'sine', 0.1), 70);
  },

  /** Play a short game-over music phrase. */
  playGameOver() {
    if (this.muted) return;
    try {
      if (this.gameOverSound) {
        this.gameOverSound.play();
        return;
      }

      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = this.musicContext ?? new AudioContextCtor();
      this.musicContext = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const notes = [659.25, 587.33, 523.25, 440, 349.23];

      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + index * 0.16;
        const end = start + 0.34;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(end);
      });
    } catch (e) {
      // silently ignore
    }
  },

  playBgm() {
    if (this.muted || !this.bgm) return;
    try {
      this.bgm.currentTime = this.bgm.currentTime || 0;
      this.bgm.play();
    } catch (e) {
      // silently ignore
    }
  },

  stopBgm() {
    try {
      if (!this.bgm) return;
      this.bgm.pause();
      this.bgm.currentTime = 0;
    } catch (e) {
      // silently ignore
    }
  },

  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.stopBgm();
    }
  },

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  },
};

// ---------------------------------------------------------------------------
// Renderer — draws all game objects onto the Canvas
// ---------------------------------------------------------------------------
const Renderer = {
  /** @type {HTMLCanvasElement|null} */
  canvas: null,
  /** @type {CanvasRenderingContext2D|null} */
  ctx: null,
  /** @type {HTMLImageElement|null} */
  ghostImage: null,
  /** @type {HTMLImageElement|null} */
  bgImage: null,
  /** @type {HTMLImageElement|null} */
  pipeImage: null,
  /** @type {HTMLImageElement|null} */
  heartImage: null,
  /** @type {HTMLImageElement|null} */
  soundOnImage: null,
  /** @type {HTMLImageElement|null} */
  soundOffImage: null,
  /** @type {HTMLImageElement|null} */
  plusHeartImage: null,
  ghostImageFailed: false,
  bgImageFailed: false,
  pipeImageFailed: false,
  heartImageFailed: false,
  soundOnImageFailed: false,
  soundOffImageFailed: false,
  plusHeartImageFailed: false,

  /**
   * Obtain the 2D context and preload the ghost sprite.
   * @param {HTMLCanvasElement} canvas
   */
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      this.ghostImage = img;
    };
    img.onerror = () => {
      this.ghostImageFailed = true;
    };
    img.src = 'assets/ghosty.png';

    const bg = new Image();
    bg.onload = () => {
      this.bgImage = bg;
    };
    bg.onerror = () => {
      this.bgImageFailed = true;
    };
    bg.src = 'assets/bg.jpg';

    const pipe = new Image();
    pipe.onload = () => {
      this.pipeImage = pipe;
    };
    pipe.onerror = () => {
      this.pipeImageFailed = true;
    };
    pipe.src = 'assets/Blocker.jpg';

    const heart = new Image();
    heart.onload = () => {
      this.heartImage = heart;
    };
    heart.onerror = () => {
      this.heartImageFailed = true;
    };
    heart.src = 'assets/Heart.png';

    const soundOn = new Image();
    soundOn.onload = () => {
      this.soundOnImage = soundOn;
    };
    soundOn.onerror = () => {
      this.soundOnImageFailed = true;
    };
    soundOn.src = 'assets/SoundOn.png';

    const soundOff = new Image();
    soundOff.onload = () => {
      this.soundOffImage = soundOff;
    };
    soundOff.onerror = () => {
      this.soundOffImageFailed = true;
    };
    soundOff.src = 'assets/SoundOff.png';

    const plusHeart = new Image();
    plusHeart.onload = () => {
      this.plusHeartImage = plusHeart;
    };
    plusHeart.onerror = () => {
      this.plusHeartImageFailed = true;
    };
    plusHeart.src = 'assets/plusHeart.png';
  },

  /**
   * Main draw entry point — calls all sub-draw methods in order.
   * @param {object} state
   */
  render(state) {
    if (!this.ctx || !this.canvas || !state) return;

    this._drawBackground(state.cameraX);
    this._drawPipes(state.pipes, state.cameraX);
    this._drawPowerUps(state.powerUps ?? [], state.cameraX);
    this._drawBullets(state.bullets, state.cameraX);
    this._drawGhost(state.ghost, state.cameraX);
    this._drawHUD(state.ghost.hp, state.score, state.highScore);
    this._drawSoundToggle(state.audioMuted);

    if (state.mode === 'start') {
      this._drawStartScreen();
    }

    if (state.mode === 'paused') {
      this._drawPauseScreen();
    }

    if (state.mode === 'gameover') {
      this._drawGameOver(state.score);
    }
  },

  /** Draw the scrolling background image, with a sky fallback. */
  _drawBackground(cameraX = 0) {
    const { ctx, canvas } = this;

    if (!this.bgImage || this.bgImageFailed) {
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const scale = canvas.height / this.bgImage.height;
    const drawWidth = this.bgImage.width * scale;
    const offset = -((cameraX * 0.35) % drawWidth);

    for (let x = offset - drawWidth; x < canvas.width + drawWidth; x += drawWidth) {
      ctx.drawImage(this.bgImage, x, 0, drawWidth, canvas.height);
    }
  },

  /**
   * Draw all pipes with optional flash and broken-zone markings.
   * Requirements: 2.6, 3.5, 3.7
   * @param {Array} pipes
   * @param {number} cameraX
   */
  _drawPipes(pipes, cameraX) {
    const { ctx, canvas } = this;

    for (const pipe of pipes) {
      const blocks = pipe.blocks ?? [];
      for (const block of blocks) {
        if (!block.active) continue;
        const x = pipe.worldX - cameraX;
        const y = this._getBlockY(pipe, block, canvas.height);
        if (y > canvas.height + block.size || y + block.size < -block.size) continue;

        if (this.pipeImage && !this.pipeImageFailed) {
          ctx.drawImage(this.pipeImage, x, y, block.size, block.size);
        } else {
          ctx.fillStyle = block.flashTimer > 0 ? '#FF0000' : '#555555';
          ctx.fillRect(x, y, block.size, block.size);
        }
      }
    }
  },

  _getBlockY(pipe, block) {
    const blockStep = pipe.blockStep ?? block.size + 4;
    const gapHalf = pipe.gapHeight / 2;
    if (block.lane === 'top') {
      return pipe.gapCenterY - gapHalf - (block.index + 1) * blockStep;
    }
    return pipe.gapCenterY + gapHalf + block.index * blockStep;
  },

  /**
   * Draw all bullets as white circles.
   * Requirements: 3.5, 3.7
   * @param {Array} bullets
   * @param {number} cameraX
   */
  _drawBullets(bullets, cameraX) {
    const { ctx } = this;

    ctx.fillStyle = '#FFFFFF';

    for (const bullet of bullets) {
      const screenX = bullet.worldX - cameraX;
      ctx.beginPath();
      ctx.arc(screenX, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /**
   * Draw the ghost sprite (or fallback rectangle) with invincibility blink.
   * @param {object} ghost
   * @param {number} cameraX
   */
  _drawGhost(ghost, cameraX) {
    // Skip rendering when blink state is hidden (invincibility effect)
    if (ghost.blinkVisible === false) return;

    const { ctx } = this;

    // Draw ghost sprite if image loaded successfully; otherwise fallback rectangle
    if (this.ghostImage !== null && !this.ghostImageFailed) {
      ctx.drawImage(this.ghostImage, ghost.screenX, ghost.y, ghost.width, ghost.height);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ghost.screenX, ghost.y, ghost.width, ghost.height);
    }
  },

  /**
   * Draw the HUD: heart HP icons (top-left) and score / high-score (top-centre).
   * @param {number} hp
   * @param {number} score
   * @param {number} highScore
   */
  _drawHUD(hp, score, highScore) {
    const { ctx, canvas } = this;

    const heartSize = 34;
    for (let i = 0; i < 3; i++) {
      const x = 10 + i * 38;
      const y = 10;

      if (this.heartImage && !this.heartImageFailed) {
        ctx.save();
        if (i >= hp) {
          ctx.globalAlpha = 0.28;
        }
        ctx.drawImage(this.heartImage, x, y, heartSize, heartSize);
        ctx.restore();
      } else {
        ctx.fillStyle = i < hp ? '#FF334E' : 'rgba(255, 255, 255, 0.38)';
        ctx.font = '22px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('HP', x, y);
      }
    }

    // Draw score and high score in top-centre
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score + '  High: ' + highScore, canvas.width / 2, 25);
  },

  _drawPowerUps(powerUps, cameraX) {
    const { ctx } = this;

    for (const item of powerUps) {
      const screenX = item.worldX - cameraX;
      if (this.plusHeartImage && !this.plusHeartImageFailed) {
        ctx.drawImage(this.plusHeartImage, screenX, item.y, item.width, item.height);
      } else {
        ctx.fillStyle = '#FF5A76';
        ctx.fillRect(screenX, item.y, item.width, item.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', screenX + item.width / 2, item.y + item.height / 2);
      }
    }
  },

  _drawSoundToggle(muted) {
    const { ctx, canvas } = this;
    const size = 34;
    const x = canvas.width - size - 12;
    const y = 10;
    const image = muted ? this.soundOffImage : this.soundOnImage;
    const failed = muted ? this.soundOffImageFailed : this.soundOnImageFailed;

    ctx.save();
    if (image && !failed) {
      ctx.drawImage(image, x, y, size, size);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(muted ? 'OFF' : 'ON', x + size / 2, y + size / 2);
    }
    ctx.restore();
  },

  _drawStartScreen() {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Kiro Ghost Shooter', cx, cy - 125);

    ctx.font = '20px Arial';
    ctx.fillText('使用 ↑ ↓ 操作角色', cx, cy - 45);
    ctx.fillText('按空白鍵發射子彈', cx, cy - 12);

    ctx.font = 'bold 20px Arial';
    ctx.fillText('按任意鍵開始', cx, cy + 80);
    ctx.restore();
  },

  _drawPauseScreen() {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px Arial';
    ctx.fillText('暫停', cx, cy - 20);
    ctx.font = '20px Arial';
    ctx.fillText('按 Enter 繼續', cx, cy + 35);
    ctx.restore();
  },

  /**
   * Draw the Game Over overlay with score and restart prompt.
   * @param {number} score
   */
  _drawGameOver(score) {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px Arial';
    ctx.fillText('Game Over', cx, cy - 55);

    ctx.font = 'bold 22px Arial';
    ctx.fillText('Score: ' + score, cx, cy);

    ctx.font = '18px Arial';
    ctx.fillText('Press Space or Enter to restart', cx, cy + 45);
    ctx.restore();
  },
};

// ---------------------------------------------------------------------------
// GameEngine — main loop, physics, collision detection, state management
// ---------------------------------------------------------------------------
const GameEngine = {
  /** @type {HTMLCanvasElement|null} */
  canvas: null,
  audioManager: null,
  renderer: null,
  lastTimestamp: 0,

  /**
   * Central game state — all mutable data lives here.
   * @type {object}
   */
  state: {
    mode: 'start',   // 'start' | 'playing' | 'paused' | 'gameover'
    cameraX: 0,
    audioMuted: false,
    ghost: {
      worldX: 0,
      screenX: 0,
      y: 0,
      vy: 0,
      width: 40,
      height: 40,
      hp: 3,
      invincible: false,
      invincibleTimer: 0,
      blinkVisible: true,
      blinkTimer: 0,
    },
    pipes: [],
    bullets: [],
    powerUps: [],
    score: 0,
    highScore: 0,
    pipeSpeed: 2,
    elapsedTime: 0,
    speedTimer: 0,
    spawnTimer: 0,
    nextHealScore: 3,
  },

  /**
   * Initialise the engine with references to canvas and sibling modules.
   * Requirements: 5.5, 8.1
   * @param {HTMLCanvasElement} canvas
   * @param {object} audioManager
   * @param {object} renderer
   */
  init(canvas, audioManager, renderer) {
    // Store module references
    this.canvas = canvas;
    this.audioManager = audioManager;
    this.renderer = renderer;

    // Read persisted high score from localStorage
    let savedHighScore = 0;
    try {
      const raw = localStorage.getItem('kiro_ghost_highscore');
      const parsed = parseInt(raw, 10);
      savedHighScore = isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      // localStorage unavailable (e.g. private browsing with restrictions) — default to 0
      savedHighScore = 0;
    }

    // Compute ghost starting positions from canvas dimensions
    const screenX = canvas.width / 3;

    // Initialise / reset all state fields to their initial values
    this.state.mode = 'start';
    this.state.cameraX = 0;
    this.state.audioMuted = this.audioManager?.muted ?? false;
    this.state.ghost.screenX = screenX;
    this.state.ghost.worldX = screenX;
    this.state.ghost.y = canvas.height / 2;
    this.state.ghost.vy = 0;
    this.state.ghost.width = 40;
    this.state.ghost.height = 40;
    this.state.ghost.hp = 3;
    this.state.ghost.invincible = false;
    this.state.ghost.invincibleTimer = 0;
    this.state.ghost.blinkVisible = true;
    this.state.ghost.blinkTimer = 0;
    this.state.pipes = [];
    this.state.bullets = [];
    this.state.powerUps = [];
    this.state.score = 0;
    this.state.highScore = savedHighScore;
    this.state.pipeSpeed = 2;
    this.state.elapsedTime = 0;
    this.state.speedTimer = 0;
    this.state.spawnTimer = 0;
    this.state.nextHealScore = this._randomHealInterval();

    this.lastTimestamp = 0;
  },

  /**
   * Per-frame update; called by requestAnimationFrame.
   * @param {number} timestamp
   */
  update(timestamp) {
    const dt = this.lastTimestamp === 0
      ? 16.67
      : Math.min(Math.max(timestamp - this.lastTimestamp, 0), 50);
    this.lastTimestamp = timestamp;

    if (this.state.mode === 'start') {
      if (KeyboardInput.consumeAnyPressed()) {
        this.startGame();
      }
      this.renderer.render(this.state);
      return;
    }

    if (this.state.mode === 'paused') {
      if (KeyboardInput.consumePressed('Enter')) {
        this.state.mode = 'playing';
        this.audioManager.playBgm?.();
      }
      this.renderer.render(this.state);
      return;
    }

    if (this.state.mode === 'gameover') {
      if (KeyboardInput.consumePressed(' ') || KeyboardInput.consumePressed('Enter')) {
        this.startGame();
      }
      this.renderer.render(this.state);
      return;
    }

    if (KeyboardInput.consumePressed('Enter')) {
      this.state.mode = 'paused';
      this.audioManager.stopBgm?.();
      this.renderer.render(this.state);
      return;
    }

    this._updateGhost(dt);
    if (this.state.mode === 'gameover') {
      this.renderer.render(this.state);
      return;
    }

    this._updatePipes(dt);
    this._updateBullets(dt);
    this._updatePowerUps();
    this._checkCollisions();
    if (this.state.mode === 'gameover') {
      this.renderer.render(this.state);
      return;
    }

    this._updateScore();
    this._updateSpeed(dt);
    this.renderer.render(this.state);
  },

  startGame() {
    this.reset();
    this.audioManager.playBgm?.();
  },

  /** Reset all game state to initial values (highScore is preserved).
   * Requirements: 6.3, 6.4
   */
  reset() {
    const { state, canvas } = this;

    // Preserve highScore across reset
    const preservedHighScore = state.highScore;

    // Reset ghost position and physics
    state.ghost.worldX = state.ghost.screenX;
    state.ghost.y = canvas.height / 2;
    state.ghost.vy = 0;
    state.ghost.hp = 3;
    state.ghost.invincible = false;
    state.ghost.invincibleTimer = 0;
    state.ghost.blinkVisible = true;
    state.ghost.blinkTimer = 0;

    // Reset game objects
    state.pipes = [];
    state.bullets = [];
    state.powerUps = [];

    // Reset scoring (but not highScore)
    state.score = 0;
    state.highScore = preservedHighScore;

    // Reset speed and timers
    state.pipeSpeed = 2;
    state.elapsedTime = 0;
    state.speedTimer = 0;
    state.spawnTimer = 0;
    state.nextHealScore = this._randomHealInterval();
    state.cameraX = 0;

    // Reset mode to playing
    state.mode = 'playing';

    // Reset main loop timestamp
    this.lastTimestamp = 0;
  },

  /** Trigger the Game Over sequence.
   * Requirements: 5.4, 6.1
   */
  triggerGameOver() {
    // Set mode to gameover
    this.state.mode = 'gameover';

    // Update high score if current score exceeds it
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      try {
        localStorage.setItem('kiro_ghost_highscore', this.state.highScore);
      } catch (e) {
        // localStorage unavailable — silently ignore
      }
    }

    // Play game over sound
    this.audioManager.stopBgm?.();
    this.audioManager.playGameOver();
  },

  handleCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = 34;
    const buttonX = this.canvas.width - size - 12;
    const buttonY = 10;

    if (x >= buttonX && x <= buttonX + size && y >= buttonY && y <= buttonY + size) {
      const muted = this.audioManager.toggleMuted?.() ?? false;
      this.state.audioMuted = muted;
      if (!muted && this.state.mode === 'playing') {
        this.audioManager.playBgm?.();
      }
    }
  },

  // Internal update helpers ---------------------------------------------------

  /** Apply gravity, handle jump input, clamp to boundaries.
   * @param {number} dt  delta-time in milliseconds
   */
  _updateGhost(dt) {
    const ghost = this.state.ghost;
    const moveSpeed = 5;

    if (KeyboardInput.isDown('ArrowUp')) {
      ghost.vy = -moveSpeed;
      if (KeyboardInput.consumePressed('ArrowUp')) {
        this.audioManager.playJump();
      }
    } else if (KeyboardInput.isDown('ArrowDown')) {
      ghost.vy = moveSpeed;
    } else {
      ghost.vy = 0;
    }

    ghost.y += ghost.vy;
    ghost.worldX += 3;

    if (ghost.y <= 0) {
      ghost.y = 0;
      ghost.vy = 0;
    }

    if (ghost.y + ghost.height > this.canvas.height) {
      ghost.y = this.canvas.height - ghost.height;
      ghost.vy = 0;
    }

    // Update invincibility timer
    if (ghost.invincible) {
      ghost.invincibleTimer -= dt;
      if (ghost.invincibleTimer <= 0) {
        ghost.invincible = false;
        ghost.blinkVisible = true;
      }
    }

    // Update blink timer (only while invincible)
    if (ghost.invincible) {
      ghost.blinkTimer -= dt;
      if (ghost.blinkTimer <= 0) {
        ghost.blinkVisible = !ghost.blinkVisible;
        ghost.blinkTimer = 100;
      }
    }
  },

  /**
   * Move pipes left, open/close their gaps, spawn new pipes.
   * Requirements: 2.1, 2.2, 2.3, 2.4
   * @param {number} dt
   */
  _updatePipes(dt) {
    const { state, canvas } = this;
    const ghost = state.ghost;
    const canvasHeight = canvas.height;
    const minGapHeight = 0;
    const maxGapHeight = 210;
    const gapStep = this._getGapStep();
    const spawnInterval = this._getSpawnInterval();
    const maxGapHalf = maxGapHeight / 2;
    const margin = 80;
    const minGap = margin + maxGapHalf;
    const maxGap = canvasHeight - margin - maxGapHalf;

    // Move and animate all pipes
    for (const pipe of state.pipes) {
      pipe.worldX -= state.pipeSpeed;

      pipe.gapHeight += pipe.gapDirection * gapStep;
      if (pipe.gapHeight <= minGapHeight) {
        pipe.gapHeight = minGapHeight;
        pipe.gapDirection = 1;
      } else if (pipe.gapHeight >= maxGapHeight) {
        pipe.gapHeight = maxGapHeight;
        pipe.gapDirection = -1;
      }

      pipe.gapCenterY = Math.min(Math.max(pipe.gapCenterY, minGap), maxGap);

      // Decrement flash timer
      if (pipe.flashTimer > 0) {
        pipe.flashTimer -= dt;
        if (pipe.flashTimer < 0) pipe.flashTimer = 0;
      }
      for (const block of pipe.blocks ?? []) {
        if (block.flashTimer > 0) {
          block.flashTimer -= dt;
          if (block.flashTimer < 0) block.flashTimer = 0;
        }
      }
    }

    // Remove pipes that have scrolled off screen left
    state.pipes = state.pipes.filter(
      (pipe) => pipe.worldX + pipe.width >= state.cameraX,
    );

    // Spawn timer: the interval shrinks as the game gets harder.
    state.spawnTimer += dt;
    while (state.spawnTimer >= spawnInterval) {
      this._spawnPipe();
      state.spawnTimer -= spawnInterval;
    }

    // Update camera position
    state.cameraX = ghost.worldX - ghost.screenX;
  },

  /**
   * Handle bullet firing, move bullets, remove out-of-bounds bullets.
   * Requirements: 3.1, 3.2, 3.3
   * @param {number} dt
   */
  _updateBullets(dt) {
    const { state, canvas } = this;
    const ghost = state.ghost;

    // Handle spacebar input: fire only the two forward diagonal shots.
    if (KeyboardInput.consumePressed(' ')) {
      this.audioManager.playShoot?.();
      const ghostCenterX = ghost.worldX + ghost.width / 2;
      const ghostCenterY = ghost.y + ghost.height / 2;
      const speed = 8;
      const angle = Math.PI / 8;
      const vx = speed * Math.cos(angle);
      const vy = speed * Math.sin(angle);

      const directions = [
        { vx, vy: -vy },
        { vx, vy },
      ];

      for (const { vx, vy } of directions) {
        state.bullets.push({
          worldX: ghostCenterX,
          y: ghostCenterY,
          vx,
          vy,
          radius: 4,
        });
      }
    }

    // Move all bullets
    for (const bullet of state.bullets) {
      bullet.worldX += bullet.vx;
      bullet.y += bullet.vy;
    }

    // --- Bullet-blocker collision detection (AABB) ---
    // Requirements: 3.4, 3.5, 3.6
    const hitBullets = new Set();

    for (const pipe of state.pipes) {
      const blockRects = this._getPipeBlockRects(pipe);

      for (let i = 0; i < state.bullets.length; i++) {
        if (hitBullets.has(i)) continue;  // already consumed

        const bullet = state.bullets[i];
        const hit = blockRects.find(({ rect }) => (
          bullet.worldX + bullet.radius > rect.left &&
          bullet.worldX - bullet.radius < rect.right &&
          bullet.y + bullet.radius > rect.top &&
          bullet.y - bullet.radius < rect.bottom
        ));

        if (hit) {
          hitBullets.add(i);
          pipe.hitCount++;
          pipe.flashTimer = 50 + Math.random() * 250;
          hit.block.hitCount++;
          hit.block.flashTimer = 80;

          if (hit.block.hitCount >= (hit.block.maxHits ?? 2)) {
            hit.block.active = false;
          }
          if (pipe.hitCount === 3 && pipe.brokenZone === null) {
            pipe.brokenZone = {
              localX: bullet.worldX - pipe.worldX,
              localY: bullet.y,
              width: pipe.width,
              height: ghost.height * 2,
            };
          }

          this.audioManager.playBulletHit?.();
        }
      }
    }

    // Remove bullets that were consumed by pipe collisions first,
    // then remove bullets that are outside canvas bounds.
    const cameraX = state.cameraX;
    state.bullets = state.bullets.filter((bullet, i) => {
      if (hitBullets.has(i)) return false;   // hit a pipe — remove
      const screenX = bullet.worldX - cameraX;
      const r = bullet.radius;
      return (
        screenX >= -r &&
        screenX <= canvas.width + r &&
        bullet.y >= -r &&
        bullet.y <= canvas.height + r
      );
    });
  },

  /**
   * AABB + circle collision detection between ghost and pipes.
   * Requirements: 4.1, 4.2, 4.4, 4.5
   */
  _checkCollisions() {
    const { state, canvas } = this;
    const ghost = state.ghost;
    const cameraX = state.cameraX;

    // Ghost screen rectangle
    const ghostLeft   = ghost.screenX;
    const ghostRight  = ghost.screenX + ghost.width;
    const ghostTop    = ghost.y;
    const ghostBottom = ghost.y + ghost.height;

    for (const pipe of state.pipes) {
      // Pipe screen X
      const ghostRect = {
        left: ghostLeft,
        right: ghostRight,
        top: ghostTop,
        bottom: ghostBottom,
      };
      const overlaps = (a, b) => (
        a.right > b.left &&
        a.left < b.right &&
        a.bottom > b.top &&
        a.top < b.bottom
      );
      const solidRects = this._getPipeBlockRects(pipe, cameraX).map(({ rect }) => rect);
      const hitSolidPipe = solidRects.some((rect) => overlaps(ghostRect, rect));
      if (!hitSolidPipe) continue;

      // --- Damage logic (Requirement 4.2) ---
      if (!ghost.invincible) {
        ghost.hp--;
        ghost.invincible = true;
        ghost.invincibleTimer = 500;
        ghost.blinkTimer = 100;
        this.audioManager.playGhostHit?.();
      }

      // --- HP depletion → Game Over (Requirement 4.4) ---
      if (ghost.hp <= 0) {
        this.triggerGameOver();
        return; // stop processing further pipes after game over
      }
    }
  },

  /** Award score when ghost clears a pipe's right edge.
   * Requirements: 5.1, 5.2
   */
  _updateScore() {
    const { ghost, pipes } = this.state;
    for (const pipe of pipes) {
      if (ghost.worldX > pipe.worldX + pipe.width && pipe.scored === false) {
        pipe.scored = true;
        this.state.score++;
        if (this.state.score >= this.state.nextHealScore) {
          this._spawnHealPowerUp();
          this.state.nextHealScore = this.state.score + this._randomHealInterval();
        }
      }
    }
  },

  _randomHealInterval() {
    return 3 + Math.floor(Math.random() * 3);
  },

  _spawnHealPowerUp() {
    const { state, canvas } = this;
    const size = 34;
    const margin = 70;
    state.powerUps.push({
      type: 'heal',
      worldX: state.ghost.worldX + canvas.width,
      y: margin + Math.random() * (canvas.height - margin * 2 - size),
      width: size,
      height: size,
    });
  },

  _updatePowerUps() {
    const { state } = this;
    const ghost = state.ghost;
    const cameraX = state.cameraX;
    const ghostLeft = ghost.screenX;
    const ghostRight = ghost.screenX + ghost.width;
    const ghostTop = ghost.y;
    const ghostBottom = ghost.y + ghost.height;

    state.powerUps = state.powerUps.filter((item) => {
      const itemLeft = item.worldX - cameraX;
      const itemRight = itemLeft + item.width;
      const itemTop = item.y;
      const itemBottom = item.y + item.height;
      const overlaps = (
        ghostRight > itemLeft &&
        ghostLeft < itemRight &&
        ghostBottom > itemTop &&
        ghostTop < itemBottom
      );

      if (overlaps) {
        if (item.type === 'heal' && ghost.hp < 3) {
          ghost.hp++;
        }
        if (item.type === 'heal') {
          this.audioManager.playHeal?.();
        }
        return false;
      }

      return itemRight >= -20;
    });
  },

  /**
   * Increment pipe speed every 5 seconds up to the maximum of 6 px/frame.
   * Requirements: 2.5
   * @param {number} dt
   */
  _updateSpeed(dt) {
    this.state.speedTimer += dt;
    this.state.elapsedTime += dt;
    this.state.pipeSpeed = 2 + this._getDifficultyProgress() * 5;
  },

  // Internal pipe helpers -----------------------------------------------------

  _getDifficultyProgress() {
    return Math.min(Math.max(this.state.elapsedTime / 120000, 0), 1);
  },

  _getGapStep() {
    return 2 + this._getDifficultyProgress() * 6;
  },

  _getSpawnInterval() {
    return 1500 - this._getDifficultyProgress() * 1000;
  },

  _getBlockMaxHits() {
    const elapsed = this.state.elapsedTime;
    if (elapsed >= 105000) return 5;
    if (elapsed >= 75000) return 4;
    if (elapsed >= 40000) return 3;
    return 2;
  },

  _getBlockY(pipe, block) {
    const blockStep = pipe.blockStep ?? block.size + 4;
    const gapHalf = pipe.gapHeight / 2;
    if (block.lane === 'top') {
      return pipe.gapCenterY - gapHalf - (block.index + 1) * blockStep;
    }
    return pipe.gapCenterY + gapHalf + block.index * blockStep;
  },

  _getPipeBlockRects(pipe, cameraX = 0) {
    this._ensurePipeBlocks(pipe);
    return (pipe.blocks ?? []).filter((block) => block.active).map((block) => {
      const left = pipe.worldX - cameraX;
      const top = this._getBlockY(pipe, block);
      return {
        block,
        rect: {
          left,
          right: left + block.size,
          top,
          bottom: top + block.size,
        },
      };
    });
  },

  _ensurePipeBlocks(pipe) {
    if (pipe.blocks) return;

    const blockSize = pipe.width ?? 60;
    const blockStep = pipe.blockStep ?? blockSize;
    const blockCount = Math.ceil((this.canvas?.height ?? 640) / blockStep) + 4;
    pipe.width = blockSize;
    pipe.blockStep = blockStep;
    pipe.blocks = [];
    for (const lane of ['top', 'bottom']) {
      for (let index = 0; index < blockCount; index++) {
        pipe.blocks.push({
          lane,
          index,
          size: blockSize,
          active: true,
          hitCount: 0,
          maxHits: 2,
          flashTimer: 0,
        });
      }
    }
  },

  /** Spawn a new pipe pair at the right edge of the canvas.
   * Requirements: 2.1, 2.3
   */
  _spawnPipe() {
    const { state, canvas } = this;
    const ghost = state.ghost;
    const canvasHeight = canvas.height;
    const blockSize = 60;
    const blockGap = 4;
    const blockStep = blockSize + blockGap;
    const gapHeight = 180;
    const maxGapHeight = 210;
    const gapHalf = maxGapHeight / 2;
    const margin = 80;
    const minGap = margin + gapHalf;          // 155
    const maxGap = canvasHeight - margin - gapHalf; // canvasHeight - 155

    const gapCenterY = minGap + Math.random() * (maxGap - minGap);
    const gapDirection = Math.random() < 0.5 ? 1 : -1;
    const blockCount = Math.ceil(canvasHeight / blockStep) + 4;
    const blockMaxHits = this._getBlockMaxHits();
    const blocks = [];
    for (const lane of ['top', 'bottom']) {
      for (let index = 0; index < blockCount; index++) {
        blocks.push({
          lane,
          index,
          size: blockSize,
          active: true,
          hitCount: 0,
          maxHits: blockMaxHits,
          flashTimer: 0,
        });
      }
    }

    state.pipes.push({
      worldX: ghost.worldX + canvas.width,
      width: blockSize,
      gapCenterY,
      gapHeight,
      gapDirection,
      blockStep,
      blocks,
      hitCount: 0,
      scored: false,
      flashTimer: 0,
      brokenZone: null,
    });
  },
};

// ---------------------------------------------------------------------------
// Startup — wire everything together once the DOM is ready
// ---------------------------------------------------------------------------
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    KeyboardInput.init();
    AudioManager.init();
    Renderer.init(canvas);
    GameEngine.init(canvas, AudioManager, Renderer);
    canvas.addEventListener('click', (event) => GameEngine.handleCanvasClick(event));

    const loop = (ts) => {
      GameEngine.update(ts);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

if (typeof window !== 'undefined') {
  window.KeyboardInput = KeyboardInput;
  window.AudioManager = AudioManager;
  window.Renderer = Renderer;
  window.GameEngine = GameEngine;
}
