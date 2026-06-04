/**
 * Test entry point — verifies all modules can be imported and expose
 * their expected public APIs.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GameEngine,
  Renderer,
  AudioManager,
  KeyboardInput,
} from '../game.js';

// Save the real triggerGameOver before any test suite can replace it with a mock.
// Several suites do `GameEngine.triggerGameOver = vi.fn()` in beforeEach, and because
// GameEngine is a module-level singleton those replacements persist across describe blocks.
const _realTriggerGameOver = GameEngine.triggerGameOver;

// ---------------------------------------------------------------------------
// Smoke tests: confirm named exports exist and are objects with the correct
// method signatures.
// ---------------------------------------------------------------------------

describe('Module imports', () => {
  it('GameEngine is exported and is an object', () => {
    expect(GameEngine).toBeDefined();
    expect(typeof GameEngine).toBe('object');
  });

  it('Renderer is exported and is an object', () => {
    expect(Renderer).toBeDefined();
    expect(typeof Renderer).toBe('object');
  });

  it('AudioManager is exported and is an object', () => {
    expect(AudioManager).toBeDefined();
    expect(typeof AudioManager).toBe('object');
  });

  it('KeyboardInput is exported and is an object', () => {
    expect(KeyboardInput).toBeDefined();
    expect(typeof KeyboardInput).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// API shape tests: each module must expose its declared methods.
// ---------------------------------------------------------------------------

describe('GameEngine API shape', () => {
  const methods = [
    'init', 'update', 'reset', 'triggerGameOver',
    '_updateGhost', '_updatePipes', '_updateBullets',
    '_checkCollisions', '_updateScore', '_updateSpeed', '_spawnPipe',
  ];

  methods.forEach((method) => {
    it(`GameEngine.${method} is a function`, () => {
      expect(typeof GameEngine[method]).toBe('function');
    });
  });
});

describe('Renderer API shape', () => {
  const methods = [
    'init', 'render',
    '_drawBackground', '_drawPipes', '_drawBullets',
    '_drawGhost', '_drawHUD', '_drawGameOver',
  ];

  methods.forEach((method) => {
    it(`Renderer.${method} is a function`, () => {
      expect(typeof Renderer[method]).toBe('function');
    });
  });
});

describe('AudioManager API shape', () => {
  const methods = ['init', 'playJump', 'playGameOver'];

  methods.forEach((method) => {
    it(`AudioManager.${method} is a function`, () => {
      expect(typeof AudioManager[method]).toBe('function');
    });
  });
});

describe('KeyboardInput API shape', () => {
  const methods = ['init', 'isDown', 'consumePressed'];

  methods.forEach((method) => {
    it(`KeyboardInput.${method} is a function`, () => {
      expect(typeof KeyboardInput[method]).toBe('function');
    });
  });
});

// ---------------------------------------------------------------------------
// KeyboardInput behavior tests
// Requirements: 1.3, 3.1, 6.3
// ---------------------------------------------------------------------------

describe('KeyboardInput behavior', () => {
  // Reset state before each test so tests are isolated
  beforeEach(() => {
    KeyboardInput.keysDown.clear();
    KeyboardInput.keysPressed.clear();
  });

  it('isDown returns false when key is not pressed', () => {
    expect(KeyboardInput.isDown('ArrowUp')).toBe(false);
  });

  it('isDown returns true when key is in keysDown', () => {
    KeyboardInput.keysDown.add('ArrowUp');
    expect(KeyboardInput.isDown('ArrowUp')).toBe(true);
  });

  it('isDown returns false after key is removed from keysDown', () => {
    KeyboardInput.keysDown.add('Space');
    KeyboardInput.keysDown.delete('Space');
    expect(KeyboardInput.isDown('Space')).toBe(false);
  });

  it('consumePressed returns false when key was never pressed', () => {
    expect(KeyboardInput.consumePressed('Enter')).toBe(false);
  });

  it('consumePressed returns true when key is in keysPressed', () => {
    KeyboardInput.keysPressed.add(' ');
    expect(KeyboardInput.consumePressed(' ')).toBe(true);
  });

  it('consumePressed removes key from keysPressed after consuming', () => {
    KeyboardInput.keysPressed.add(' ');
    KeyboardInput.consumePressed(' ');
    expect(KeyboardInput.keysPressed.has(' ')).toBe(false);
  });

  it('consumePressed returns false on second call for same key press', () => {
    KeyboardInput.keysPressed.add('ArrowUp');
    KeyboardInput.consumePressed('ArrowUp');
    expect(KeyboardInput.consumePressed('ArrowUp')).toBe(false);
  });

  it('keydown event adds key to keysDown and keysPressed', () => {
    KeyboardInput.init();
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    window.dispatchEvent(event);
    expect(KeyboardInput.keysDown.has('ArrowUp')).toBe(true);
    expect(KeyboardInput.keysPressed.has('ArrowUp')).toBe(true);
  });

  it('keyup event removes key from keysDown but not keysPressed', () => {
    KeyboardInput.keysDown.add('ArrowUp');
    KeyboardInput.keysPressed.add('ArrowUp');
    const event = new KeyboardEvent('keyup', { key: 'ArrowUp' });
    window.dispatchEvent(event);
    expect(KeyboardInput.keysDown.has('ArrowUp')).toBe(false);
    expect(KeyboardInput.keysPressed.has('ArrowUp')).toBe(true);
  });

  it('multiple different keys can be tracked simultaneously', () => {
    KeyboardInput.keysDown.add('ArrowUp');
    KeyboardInput.keysDown.add(' ');
    expect(KeyboardInput.isDown('ArrowUp')).toBe(true);
    expect(KeyboardInput.isDown(' ')).toBe(true);
    expect(KeyboardInput.isDown('Enter')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GameEngine initial state shape
// ---------------------------------------------------------------------------

describe('GameEngine initial state', () => {
  it('state object exists with expected top-level keys', () => {
    const { state } = GameEngine;
    expect(state).toBeDefined();
    expect(state).toHaveProperty('mode');
    expect(state).toHaveProperty('ghost');
    expect(state).toHaveProperty('pipes');
    expect(state).toHaveProperty('bullets');
    expect(state).toHaveProperty('score');
    expect(state).toHaveProperty('highScore');
    expect(state).toHaveProperty('pipeSpeed');
  });

  it('ghost object has expected sub-keys', () => {
    const { ghost } = GameEngine.state;
    expect(ghost).toHaveProperty('worldX');
    expect(ghost).toHaveProperty('y');
    expect(ghost).toHaveProperty('vy');
    expect(ghost).toHaveProperty('hp');
    expect(ghost).toHaveProperty('width');
    expect(ghost).toHaveProperty('height');
    expect(ghost).toHaveProperty('invincible');
  });

  it('pipes and bullets are arrays', () => {
    expect(Array.isArray(GameEngine.state.pipes)).toBe(true);
    expect(Array.isArray(GameEngine.state.bullets)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AudioManager unit tests
// Requirements: 7.1, 7.2
// ---------------------------------------------------------------------------

describe('AudioManager', () => {
  // Helper to create a mock Audio element
  function makeMockAudio(playImpl) {
    return {
      currentTime: 0,
      play: playImpl ?? (() => Promise.resolve()),
    };
  }

  it('init() creates jumpSound and gameOverSound', () => {
    // jsdom does not support Audio; we verify init() does not throw
    // and sets the sound properties (they may remain null if Audio throws)
    expect(() => AudioManager.init()).not.toThrow();
  });

  it('playJump() resets currentTime to 0 before playing', () => {
    let calledPlay = false;
    const mock = makeMockAudio(() => { calledPlay = true; return Promise.resolve(); });
    mock.currentTime = 99;
    AudioManager.jumpSound = mock;

    AudioManager.playJump();

    expect(mock.currentTime).toBe(0);
    expect(calledPlay).toBe(true);
  });

  it('playJump() silently handles errors thrown by play()', () => {
    AudioManager.jumpSound = makeMockAudio(() => { throw new Error('Audio error'); });
    expect(() => AudioManager.playJump()).not.toThrow();
  });

  it('playJump() silently handles a null jumpSound', () => {
    AudioManager.jumpSound = null;
    expect(() => AudioManager.playJump()).not.toThrow();
  });

  it('playGameOver() calls play() on gameOverSound', () => {
    let calledPlay = false;
    AudioManager.gameOverSound = makeMockAudio(() => { calledPlay = true; return Promise.resolve(); });

    AudioManager.playGameOver();

    expect(calledPlay).toBe(true);
  });

  it('playGameOver() silently handles errors thrown by play()', () => {
    AudioManager.gameOverSound = makeMockAudio(() => { throw new Error('Audio error'); });
    expect(() => AudioManager.playGameOver()).not.toThrow();
  });

  it('playGameOver() silently handles a null gameOverSound', () => {
    AudioManager.gameOverSound = null;
    expect(() => AudioManager.playGameOver()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// GameEngine.init() tests
// Requirements: 5.5, 8.1
// ---------------------------------------------------------------------------

describe('GameEngine.init()', () => {
  /** Build a minimal mock canvas with controllable dimensions */
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  const mockAudioManager = {};
  const mockRenderer = {};

  beforeEach(() => {
    // Clear localStorage before each test so tests are isolated
    localStorage.clear();
  });

  it('stores canvas, audioManager and renderer references', () => {
    const canvas = makeMockCanvas();
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.canvas).toBe(canvas);
    expect(GameEngine.audioManager).toBe(mockAudioManager);
    expect(GameEngine.renderer).toBe(mockRenderer);
  });

  it('sets ghost.screenX to canvas.width / 3', () => {
    const canvas = makeMockCanvas(900, 600);
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.ghost.screenX).toBe(300); // 900 / 3
  });

  it('sets ghost.worldX to ghost.screenX', () => {
    const canvas = makeMockCanvas(900, 600);
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.ghost.worldX).toBe(GameEngine.state.ghost.screenX);
  });

  it('sets ghost.y to canvas.height / 2', () => {
    const canvas = makeMockCanvas(600, 400);
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.ghost.y).toBe(200); // 400 / 2
  });

  it('resets score to 0', () => {
    const canvas = makeMockCanvas();
    GameEngine.state.score = 99;
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.score).toBe(0);
  });

  it('resets pipes and bullets to empty arrays', () => {
    const canvas = makeMockCanvas();
    GameEngine.state.pipes = [{ worldX: 100 }];
    GameEngine.state.bullets = [{ worldX: 50 }];
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.pipes).toEqual([]);
    expect(GameEngine.state.bullets).toEqual([]);
  });

  it('resets pipeSpeed to 2', () => {
    const canvas = makeMockCanvas();
    GameEngine.state.pipeSpeed = 6;
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.pipeSpeed).toBe(2);
  });

  it('resets ghost.hp to 3', () => {
    const canvas = makeMockCanvas();
    GameEngine.state.ghost.hp = 0;
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.ghost.hp).toBe(3);
  });

  it('sets mode to "start"', () => {
    const canvas = makeMockCanvas();
    GameEngine.state.mode = 'gameover';
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.mode).toBe('start');
  });

  it('reads highScore from localStorage when a valid integer is stored', () => {
    localStorage.setItem('kiro_ghost_highscore', '42');
    const canvas = makeMockCanvas();
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.highScore).toBe(42);
  });

  it('defaults highScore to 0 when localStorage key is absent', () => {
    // localStorage.clear() already called in beforeEach
    const canvas = makeMockCanvas();
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.highScore).toBe(0);
  });

  it('defaults highScore to 0 when localStorage contains a non-numeric value', () => {
    localStorage.setItem('kiro_ghost_highscore', 'not-a-number');
    const canvas = makeMockCanvas();
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.highScore).toBe(0);
  });

  it('defaults highScore to 0 when localStorage.getItem throws', () => {
    // Temporarily make localStorage.getItem throw
    const originalGetItem = localStorage.getItem.bind(localStorage);
    vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new Error('localStorage unavailable');
    });

    const canvas = makeMockCanvas();
    GameEngine.init(canvas, mockAudioManager, mockRenderer);

    expect(GameEngine.state.highScore).toBe(0);

    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// GameEngine._updateGhost(dt) unit tests
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1
// ---------------------------------------------------------------------------

describe('GameEngine._updateGhost(dt)', () => {
  /** Build a minimal mock canvas */
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  /** Mock audioManager that tracks playJump calls */
  function makeMockAudio() {
    return {
      playJump: vi.fn(),
      playGameOver: vi.fn(),
    };
  }

  let mockCanvas;
  let mockAudio;

  beforeEach(() => {
    mockCanvas = makeMockCanvas(600, 400);
    mockAudio = makeMockAudio();

    // Reset KeyboardInput state
    KeyboardInput.keysDown.clear();
    KeyboardInput.keysPressed.clear();

    // Re-init GameEngine with mock dependencies
    GameEngine.init(mockCanvas, mockAudio, {});

    // Ensure triggerGameOver is a no-op during physics tests (unless specifically testing it)
    GameEngine.triggerGameOver = vi.fn();
  });

  // --- Gravity (Requirement 1.2) ---

  it('keeps ghost.vy at 0 when no vertical key is held', () => {
    GameEngine.state.ghost.vy = 0;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.vy).toBe(0);
  });

  it('does not apply cumulative gravity across multiple frames', () => {
    GameEngine.state.ghost.vy = 0;
    GameEngine._updateGhost(16);
    GameEngine._updateGhost(16);
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.vy).toBe(0);
  });

  it('does not drift vertically when no vertical key is held', () => {
    GameEngine.state.ghost.vy = 2;
    GameEngine.state.ghost.y = 100;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.y).toBe(100);
  });

  // --- Horizontal movement (Requirement 1.1) ---

  it('moves ghost.worldX right by 3 each frame', () => {
    const initialWorldX = GameEngine.state.ghost.worldX;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.worldX).toBe(initialWorldX + 3);
  });

  // --- Jump (Requirement 1.3) ---

  it('sets vy to -5 when ArrowUp is held', () => {
    KeyboardInput.keysDown.add('ArrowUp');
    GameEngine.state.ghost.vy = 5;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.vy).toBe(-5);
    expect(GameEngine.state.ghost.y).toBe(195);
  });

  it('sets vy to 5 when ArrowDown is held', () => {
    KeyboardInput.keysDown.add('ArrowDown');
    GameEngine.state.ghost.y = 100;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.vy).toBe(5);
    expect(GameEngine.state.ghost.y).toBe(105);
  });

  it('calls audioManager.playJump() when ArrowUp is pressed', () => {
    KeyboardInput.keysDown.add('ArrowUp');
    KeyboardInput.keysPressed.add('ArrowUp');
    GameEngine._updateGhost(16);
    expect(mockAudio.playJump).toHaveBeenCalledOnce();
  });

  it('does not call audioManager.playJump() when ArrowUp is not pressed', () => {
    GameEngine._updateGhost(16);
    expect(mockAudio.playJump).not.toHaveBeenCalled();
  });

  it('plays jump audio once while ArrowUp is held across frames', () => {
    KeyboardInput.keysDown.add('ArrowUp');
    KeyboardInput.keysPressed.add('ArrowUp');
    GameEngine._updateGhost(16);
    GameEngine._updateGhost(16);
    expect(mockAudio.playJump).toHaveBeenCalledTimes(1);
  });

  // --- Upper boundary clamp (Requirement 1.5) ---

  it('clamps ghost.y to 0 when it goes above the top boundary', () => {
    GameEngine.state.ghost.y = 5;
    KeyboardInput.keysDown.add('ArrowUp');
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.y).toBe(0);
  });

  it('sets ghost.vy to 0 when clamped at upper boundary', () => {
    GameEngine.state.ghost.y = 5;
    KeyboardInput.keysDown.add('ArrowUp');
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.vy).toBe(0);
  });

  it('does not clamp when ghost.y stays above 0 after update', () => {
    GameEngine.state.ghost.y = 50;
    KeyboardInput.keysDown.add('ArrowDown');
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.y).toBeGreaterThan(0);
    expect(GameEngine.state.ghost.vy).not.toBe(0);
  });

  // --- Lower boundary → Game Over (Requirement 1.4) ---

  it('clamps ghost at the bottom instead of triggering Game Over', () => {
    GameEngine.state.ghost.y = mockCanvas.height - GameEngine.state.ghost.height + 1;
    KeyboardInput.keysDown.add('ArrowDown');
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.y).toBe(mockCanvas.height - GameEngine.state.ghost.height);
    expect(GameEngine.triggerGameOver).not.toHaveBeenCalled();
  });

  it('does not call triggerGameOver() when ghost is within bounds', () => {
    GameEngine.state.ghost.y = 100;
    GameEngine.state.ghost.vy = 2;
    GameEngine._updateGhost(16);
    expect(GameEngine.triggerGameOver).not.toHaveBeenCalled();
  });

  // --- Invincibility timer (Requirements 4.2) ---

  it('decrements invincibleTimer by dt while invincible', () => {
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 500;
    GameEngine.state.ghost.blinkTimer = 100;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.invincibleTimer).toBeCloseTo(484);
  });

  it('sets invincible to false when invincibleTimer reaches 0', () => {
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 10;
    GameEngine.state.ghost.blinkTimer = 100;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.invincible).toBe(false);
  });

  it('restores blinkVisible to true when invincibility expires', () => {
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 10;
    GameEngine.state.ghost.blinkTimer = 100;
    GameEngine.state.ghost.blinkVisible = false;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.blinkVisible).toBe(true);
  });

  // --- Blink timer (Requirements 4.2) ---

  it('decrements blinkTimer by dt while invincible', () => {
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 500;
    GameEngine.state.ghost.blinkTimer = 100;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.blinkTimer).toBeCloseTo(84);
  });

  it('toggles blinkVisible and resets blinkTimer to 100 when blinkTimer expires', () => {
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 500;
    GameEngine.state.ghost.blinkTimer = 10;  // will expire after 16ms dt
    GameEngine.state.ghost.blinkVisible = true;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.blinkVisible).toBe(false);
    expect(GameEngine.state.ghost.blinkTimer).toBe(100);
  });

  it('does not modify blinkTimer when not invincible', () => {
    GameEngine.state.ghost.invincible = false;
    GameEngine.state.ghost.blinkTimer = 50;
    GameEngine._updateGhost(16);
    expect(GameEngine.state.ghost.blinkTimer).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// GameEngine._spawnPipe() and _updatePipes(dt) tests
// Requirements: 2.1, 2.2, 2.3, 2.4
// ---------------------------------------------------------------------------

describe('GameEngine._spawnPipe()', () => {
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  beforeEach(() => {
    const canvas = makeMockCanvas(600, 400);
    GameEngine.init(canvas, {}, {});
  });

  it('adds exactly one pipe to state.pipes', () => {
    expect(GameEngine.state.pipes).toHaveLength(0);
    GameEngine._spawnPipe();
    expect(GameEngine.state.pipes).toHaveLength(1);
  });

  it('spawned pipe has worldX = ghost.worldX + canvas.width', () => {
    const ghost = GameEngine.state.ghost;
    const expectedX = ghost.worldX + GameEngine.canvas.width;
    GameEngine._spawnPipe();
    expect(GameEngine.state.pipes[0].worldX).toBe(expectedX);
  });

  it('spawned pipe has width = 60', () => {
    GameEngine._spawnPipe();
    expect(GameEngine.state.pipes[0].width).toBe(60);
  });

  it('spawned pipe has gapHeight = 180', () => {
    GameEngine._spawnPipe();
    expect(GameEngine.state.pipes[0].gapHeight).toBe(180);
  });

  it('gapCenterY is within safe boundaries for the largest gap', () => {
    const canvasHeight = GameEngine.canvas.height; // 400
    const minGap = 185;
    const maxGap = canvasHeight - 185; // 215
    // Spawn many pipes to cover random range
    for (let i = 0; i < 50; i++) {
      GameEngine._spawnPipe();
    }
    for (const pipe of GameEngine.state.pipes) {
      expect(pipe.gapCenterY).toBeGreaterThanOrEqual(minGap);
      expect(pipe.gapCenterY).toBeLessThanOrEqual(maxGap);
    }
  });

  it('gapDirection is +1 or -1', () => {
    for (let i = 0; i < 20; i++) {
      GameEngine._spawnPipe();
    }
    for (const pipe of GameEngine.state.pipes) {
      expect([1, -1]).toContain(pipe.gapDirection);
    }
  });

  it('spawned pipe has hitCount=0, scored=false, flashTimer=0, brokenZone=null', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    expect(pipe.hitCount).toBe(0);
    expect(pipe.scored).toBe(false);
    expect(pipe.flashTimer).toBe(0);
    expect(pipe.brokenZone).toBeNull();
  });

  it('spawned blocker squares start with 2 HP early in the game', () => {
    GameEngine.state.elapsedTime = 0;
    GameEngine._spawnPipe();
    expect(GameEngine.state.pipes[0].blocks[0].maxHits).toBe(2);
  });

  it('spawned blocker squares gain HP later in the game', () => {
    GameEngine.state.elapsedTime = 105000;
    GameEngine._spawnPipe();
    expect(GameEngine.state.pipes[0].blocks[0].maxHits).toBe(5);
  });
});

describe('GameEngine._updatePipes(dt)', () => {
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  beforeEach(() => {
    const canvas = makeMockCanvas(600, 400);
    GameEngine.init(canvas, {}, {});
  });

  it('moves all pipes left by pipeSpeed each call', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    const initialX = pipe.worldX;
    const speed = GameEngine.state.pipeSpeed;
    GameEngine._updatePipes(16);
    expect(pipe.worldX).toBe(initialX - speed);
  });

  it('opens and closes gapHeight by 2 in gapDirection each frame', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    pipe.gapHeight = 150;
    pipe.gapDirection = 1;
    GameEngine._updatePipes(16);
    expect(pipe.gapHeight).toBe(152);
  });

  it('reverses gapDirection at minimum gapHeight', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    pipe.gapHeight = 1;
    pipe.gapDirection = -1;
    GameEngine._updatePipes(16);
    expect(pipe.gapHeight).toBe(0);
    expect(pipe.gapDirection).toBe(1);
  });

  it('reverses gapDirection at maximum gapHeight', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    pipe.gapHeight = 209;
    pipe.gapDirection = 1;
    GameEngine._updatePipes(16);
    expect(pipe.gapHeight).toBe(210);
    expect(pipe.gapDirection).toBe(-1);
  });

  it('gapCenterY never exceeds boundaries across many frames', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    pipe.gapCenterY = 200;
    pipe.gapDirection = 1;
    const canvasHeight = GameEngine.canvas.height;
    const minGap = 185;
    const maxGap = canvasHeight - 185;
    for (let i = 0; i < 200; i++) {
      // Keep pipe on screen so it is not removed
      pipe.worldX = GameEngine.state.ghost.worldX + 100;
      GameEngine._updatePipes(16);
      expect(pipe.gapCenterY).toBeGreaterThanOrEqual(minGap);
      expect(pipe.gapCenterY).toBeLessThanOrEqual(maxGap);
    }
  });

  it('removes pipes that have scrolled off the left edge', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    // Place pipe far behind cameraX so it should be removed
    pipe.worldX = GameEngine.state.cameraX - pipe.width - 10;
    GameEngine._updatePipes(16);
    // The pipe should have been removed
    expect(GameEngine.state.pipes).toHaveLength(0);
  });

  it('does not remove pipes still on screen', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    // Ensure pipe is well ahead of camera
    pipe.worldX = GameEngine.state.ghost.worldX + 200;
    GameEngine._updatePipes(16);
    expect(GameEngine.state.pipes).toHaveLength(1);
  });

  it('spawns a new pipe when spawnTimer reaches 1500ms', () => {
    expect(GameEngine.state.pipes).toHaveLength(0);
    GameEngine.state.spawnTimer = 1490;
    GameEngine._updatePipes(20); // 1490 + 20 = 1510 >= 1500 → spawn
    expect(GameEngine.state.pipes).toHaveLength(1);
  });

  it('resets spawnTimer after spawn (subtracts 1500, not resets to 0)', () => {
    GameEngine.state.spawnTimer = 1490;
    GameEngine._updatePipes(20); // timer becomes 1510 − 1500 = 10
    expect(GameEngine.state.spawnTimer).toBeCloseTo(10);
  });

  it('does not spawn before 1500ms', () => {
    GameEngine.state.spawnTimer = 0;
    GameEngine._updatePipes(1000);
    expect(GameEngine.state.pipes).toHaveLength(0);
  });

  it('updates cameraX = ghost.worldX - ghost.screenX', () => {
    GameEngine._updatePipes(16);
    const ghost = GameEngine.state.ghost;
    expect(GameEngine.state.cameraX).toBe(ghost.worldX - ghost.screenX);
  });

  it('opens and closes faster later in the game', () => {
    GameEngine._spawnPipe();
    const pipe = GameEngine.state.pipes[0];
    pipe.gapHeight = 100;
    pipe.gapDirection = 1;
    GameEngine.state.elapsedTime = 120000;
    GameEngine._updatePipes(16);
    expect(pipe.gapHeight).toBe(108);
  });

  it('spawns obstacles more frequently later in the game', () => {
    GameEngine.state.elapsedTime = 120000;
    GameEngine.state.spawnTimer = 499;
    GameEngine._updatePipes(1);
    expect(GameEngine.state.pipes).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GameEngine._updateSpeed(dt) unit tests
// Requirements: 2.5
// ---------------------------------------------------------------------------

describe('GameEngine._updateSpeed(dt)', () => {
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  beforeEach(() => {
    GameEngine.init(makeMockCanvas(), {}, {});
  });

  it('accumulates speedTimer by dt each call', () => {
    GameEngine.state.speedTimer = 0;
    GameEngine._updateSpeed(100);
    expect(GameEngine.state.speedTimer).toBeCloseTo(100);
  });

  it('accumulates speedTimer across multiple calls and keeps early speed gentle', () => {
    GameEngine.state.speedTimer = 0;
    GameEngine._updateSpeed(1000);
    GameEngine._updateSpeed(1000);
    GameEngine._updateSpeed(1000);
    expect(GameEngine.state.speedTimer).toBeCloseTo(3000);
    expect(GameEngine.state.pipeSpeed).toBeCloseTo(2.125);
  });

  it('raises pipeSpeed smoothly based on elapsed play time', () => {
    GameEngine.state.elapsedTime = 60000;
    GameEngine._updateSpeed(0);
    expect(GameEngine.state.pipeSpeed).toBeCloseTo(4.5);
  });

  it('keeps speedTimer cumulative for diagnostics', () => {
    GameEngine.state.speedTimer = 4990;
    GameEngine._updateSpeed(20);
    expect(GameEngine.state.speedTimer).toBeCloseTo(5010);
  });

  it('barely increases pipeSpeed before the first few seconds have passed', () => {
    GameEngine.state.speedTimer = 0;
    GameEngine._updateSpeed(4999);
    expect(GameEngine.state.pipeSpeed).toBeCloseTo(2.208);
  });

  it('caps pipeSpeed at 7 once the two-minute difficulty target is reached', () => {
    GameEngine.state.elapsedTime = 120000;
    GameEngine._updateSpeed(5000);
    expect(GameEngine.state.pipeSpeed).toBe(7);
  });

  it('never exceeds pipeSpeed of 7 even with many elapsed frames', () => {
    GameEngine.state.pipeSpeed = 2;
    GameEngine.state.speedTimer = 0;
    for (let i = 0; i < 30; i++) {
      GameEngine._updateSpeed(5000);
    }
    expect(GameEngine.state.pipeSpeed).toBe(7);
  });

  it('pipeSpeed starts at 2 and only increases', () => {
    const initialSpeed = GameEngine.state.pipeSpeed;
    expect(initialSpeed).toBe(2);
    GameEngine._updateSpeed(5100);
    expect(GameEngine.state.pipeSpeed).toBeGreaterThanOrEqual(initialSpeed);
  });

  it('handles multiple updates using continuous elapsed difficulty', () => {
    GameEngine.state.speedTimer = 0;
    GameEngine.state.pipeSpeed = 2;
    GameEngine._updateSpeed(5000);
    GameEngine._updateSpeed(5000);
    expect(GameEngine.state.pipeSpeed).toBeCloseTo(2.4167);
  });

  it('difficulty helper reaches full pressure at two minutes', () => {
    GameEngine.state.elapsedTime = 120000;
    expect(GameEngine._getDifficultyProgress()).toBe(1);
    expect(GameEngine._getSpawnInterval()).toBe(500);
    expect(GameEngine._getGapStep()).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// GameEngine._updateBullets(dt) unit tests
// Requirements: 3.1, 3.2, 3.3
// ---------------------------------------------------------------------------

describe('GameEngine._updateBullets(dt)', () => {
  /** Build a minimal mock canvas */
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  beforeEach(() => {
    KeyboardInput.keysDown.clear();
    KeyboardInput.keysPressed.clear();

    GameEngine.init(makeMockCanvas(600, 400), {}, {});
    // Ensure triggerGameOver is a no-op
    GameEngine.triggerGameOver = vi.fn();
    // Fix cameraX so bullet boundary tests are predictable
    GameEngine.state.cameraX = 0;
  });

  // --- Bullet spawning (Requirement 3.1) ---

  it('does not spawn bullets when space is not pressed', () => {
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(0);
  });

  it('spawns exactly 2 diagonal bullets when space is pressed', () => {
    KeyboardInput.keysPressed.add(' ');
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(2);
  });

  it('each spawned bullet has radius 4', () => {
    KeyboardInput.keysPressed.add(' ');
    GameEngine._updateBullets(16);
    for (const bullet of GameEngine.state.bullets) {
      expect(bullet.radius).toBe(4);
    }
  });

  it('bullets are spawned at ghost centre', () => {
    const ghost = GameEngine.state.ghost;
    ghost.worldX = 100;
    ghost.y = 80;
    ghost.width = 40;
    ghost.height = 40;
    GameEngine.state.cameraX = 0;

    const expectedCX = ghost.worldX + ghost.width / 2;   // 120
    const expectedCY = ghost.y + ghost.height / 2;       // 100

    KeyboardInput.keysPressed.add(' ');
    // Call without moving — worldX before movement step equals spawn position
    // (movement happens after spawn check in _updateBullets)
    // We'll check initial worldX via the stored values before any move frame
    // by checking all bullets were placed at the expected centre.
    GameEngine._updateBullets(16);
    for (const bullet of GameEngine.state.bullets) {
      // After one _updateBullets call the bullets have moved by their vx/vy once.
      // So reverse-check: worldX - vx should equal spawn X.
      expect(bullet.worldX - bullet.vx).toBeCloseTo(expectedCX, 5);
      expect(bullet.y - bullet.vy).toBeCloseTo(expectedCY, 5);
    }
  });

  it('spawned bullets keep speed 8', () => {
    KeyboardInput.keysPressed.add(' ');
    GameEngine._updateBullets(16);
    for (const bullet of GameEngine.state.bullets) {
      const speed = Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2);
      expect(speed).toBeCloseTo(8, 1);
    }
  });

  it('bullets only use narrow upward-right and downward-right angles', () => {
    KeyboardInput.keysPressed.add(' ');
    GameEngine._updateBullets(16);
    const bullets = GameEngine.state.bullets;
    const angles = bullets.map((b) => Math.round(Math.atan2(b.vy, b.vx) * 180 / Math.PI));
    expect(new Set(angles)).toEqual(new Set([-23, 23]));
    expect(bullets.every((bullet) => bullet.vx > 0)).toBe(true);
    expect(bullets.some((bullet) => bullet.vy === 0)).toBe(false);
  });

  it('consumes the spacebar press (second call does not spawn again)', () => {
    KeyboardInput.keysPressed.add(' ');
    GameEngine._updateBullets(16);
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(2);
  });

  // --- Bullet movement (Requirement 3.2) ---

  it('moves each bullet by (vx, vy) each frame', () => {
    KeyboardInput.keysPressed.add(' ');
    GameEngine._updateBullets(16);
    // Capture positions after first frame (spawn + one move)
    const positionsAfter1 = GameEngine.state.bullets.map((b) => ({
      worldX: b.worldX,
      y: b.y,
      vx: b.vx,
      vy: b.vy,
    }));

    // Keep bullets on screen by fixing cameraX and canvas so nothing is removed
    GameEngine.state.cameraX = 0;
    GameEngine._updateBullets(16);

    for (let i = 0; i < GameEngine.state.bullets.length; i++) {
      const prev = positionsAfter1[i];
      const curr = GameEngine.state.bullets[i];
      expect(curr.worldX).toBeCloseTo(prev.worldX + prev.vx, 5);
      expect(curr.y).toBeCloseTo(prev.y + prev.vy, 5);
    }
  });

  // --- Out-of-bounds removal (Requirement 3.3) ---

  it('removes bullets that fly past the right edge of the canvas', () => {
    // Place a rightward bullet just outside the canvas
    GameEngine.state.cameraX = 0;
    GameEngine.state.bullets = [
      { worldX: 605, y: 200, vx: 8, vy: 0, radius: 4 }, // screenX = 605 > 600+4
    ];
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(0);
  });

  it('removes bullets that fly past the left edge of the canvas', () => {
    GameEngine.state.cameraX = 0;
    GameEngine.state.bullets = [
      { worldX: -10, y: 200, vx: -8, vy: 0, radius: 4 }, // screenX = -10 < -4
    ];
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(0);
  });

  it('removes bullets that fly above the canvas top', () => {
    GameEngine.state.cameraX = 0;
    GameEngine.state.bullets = [
      { worldX: 300, y: -10, vx: 0, vy: -8, radius: 4 }, // y = -10 < -4
    ];
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(0);
  });

  it('removes bullets that fly below the canvas bottom', () => {
    GameEngine.state.cameraX = 0;
    GameEngine.state.bullets = [
      { worldX: 300, y: 410, vx: 0, vy: 8, radius: 4 }, // y = 410 > 400+4
    ];
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(0);
  });

  it('keeps bullets that are still inside canvas bounds', () => {
    GameEngine.state.cameraX = 0;
    GameEngine.state.bullets = [
      { worldX: 300, y: 200, vx: 1, vy: 1, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(1);
  });

  it('respects cameraX when computing screen position for out-of-bounds check', () => {
    // bullet worldX=700 with cameraX=100 → screenX=600, which equals canvas.width
    // bullet worldX + vx = 708 → screenX=608 > 604 → removed
    GameEngine.state.cameraX = 100;
    GameEngine.state.bullets = [
      { worldX: 700, y: 200, vx: 8, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    // After move: worldX=708, screenX=608 > 604 → removed
    expect(GameEngine.state.bullets).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// GameEngine._updateBullets — bullet-pipe collision detection
// Requirements: 3.4, 3.5, 3.6
// ---------------------------------------------------------------------------

describe('Bullet-pipe collision detection (task 5.3)', () => {
  /** Minimal mock canvas 600×400 */
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  /** Build a pipe at a given worldX with gapCenterY=200, gapHeight=150 */
  function makePipe(worldX = 300) {
    return {
      worldX,
      width: 60,
      gapCenterY: 200,
      gapHeight: 150,
      gapDirection: 1,
      hitCount: 0,
      scored: false,
      flashTimer: 0,
      brokenZone: null,
    };
  }

  beforeEach(() => {
    KeyboardInput.keysDown.clear();
    KeyboardInput.keysPressed.clear();
    GameEngine.init(makeMockCanvas(600, 400), {}, {});
    GameEngine.triggerGameOver = vi.fn();
    GameEngine.state.cameraX = 0;
    // Freeze ghost width for predictable radius calculations
    GameEngine.state.ghost.width = 40;
  });

  // ---------------------------------------------------------------------------
  // Bullet removed on hit (Requirement 3.4)
  // ---------------------------------------------------------------------------

  it('removes a bullet that hits the top pipe', () => {
    // Pipe at worldX=300, top pipe occupies y=[0, 125] (gapCenterY=200, gapHeight=150 → topBottom=125)
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    // Bullet centre inside top pipe: x=330 (in [300,360]), y=50 (in [0,125])
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 8, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    // Bullet should be removed
    expect(GameEngine.state.bullets).toHaveLength(0);
  });

  it('removes a bullet that hits the bottom pipe', () => {
    // Bottom pipe starts at y=275 (gapCenterY=200+75) up to canvas.height=400
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    // Bullet centre inside bottom pipe: x=330, y=300
    GameEngine.state.bullets = [
      { worldX: 330, y: 300, vx: -8, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(GameEngine.state.bullets).toHaveLength(0);
  });

  it('does NOT remove a bullet passing through the gap', () => {
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    // Gap is y=[125, 275]; bullet at y=200 is inside the gap — no hit
    GameEngine.state.bullets = [
      { worldX: 330, y: 200, vx: 8, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    // Bullet stays (moves to worldX=338, still within canvas)
    expect(GameEngine.state.bullets).toHaveLength(1);
  });

  it('does NOT remove a bullet outside the pipe X range', () => {
    const pipe = makePipe(300); // pipe covers worldX [300, 360]
    GameEngine.state.pipes = [pipe];
    // Bullet X=200 is before the pipe
    GameEngine.state.bullets = [
      { worldX: 200, y: 50, vx: 8, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    // Bullet not removed by collision (it's still within canvas bounds)
    expect(GameEngine.state.bullets).toHaveLength(1);
  });

  // ---------------------------------------------------------------------------
  // hitCount increment (Requirement 3.4)
  // ---------------------------------------------------------------------------

  it('increments pipe.hitCount by 1 on first hit', () => {
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.hitCount).toBe(1);
  });

  it('increments pipe.hitCount to 2 on second bullet hit', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 1;
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.hitCount).toBe(2);
  });

  it('increments pipe.hitCount to 3 on third hit', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 2;
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.hitCount).toBe(3);
  });

  it('does not double-count a single bullet hitting the same pipe twice', () => {
    // A bullet can only be consumed once per update call
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.hitCount).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // flashTimer (Requirement 3.5)
  // ---------------------------------------------------------------------------

  it('sets pipe.flashTimer to a value ≥ 50 on hit', () => {
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.flashTimer).toBeGreaterThanOrEqual(50);
  });

  it('sets pipe.flashTimer to a value ≤ 300 on hit', () => {
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.flashTimer).toBeLessThanOrEqual(300);
  });

  // ---------------------------------------------------------------------------
  // BrokenZone creation (Requirement 3.6)
  // ---------------------------------------------------------------------------

  it('does NOT create brokenZone when hitCount < 3', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 1;
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    // hitCount becomes 2 → still no brokenZone
    expect(pipe.brokenZone).toBeNull();
  });

  it('creates brokenZone when hitCount reaches 3', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 2;
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.hitCount).toBe(3);
    expect(pipe.brokenZone).not.toBeNull();
  });

  it('brokenZone has rectangular width equal to pipe width', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 2;
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.width = 40;
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.brokenZone.width).toBe(pipe.width);
  });

  it('brokenZone has rectangular height equal to two ghost heights', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 2;
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.height = 40;
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.brokenZone.height).toBe(80);
  });

  it('brokenZone localX is bullet.worldX - pipe.worldX at time of hit', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 2;
    GameEngine.state.pipes = [pipe];
    // bullet moves by vx=0 so its worldX stays at 330 during the update
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    // Collision is checked AFTER movement step (vx=0 → still 330)
    expect(pipe.brokenZone.localX).toBe(330 - 300); // 30
  });

  it('brokenZone localY is bullet.y at time of hit', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 2;
    GameEngine.state.pipes = [pipe];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.brokenZone.localY).toBe(50);
  });

  it('does NOT overwrite brokenZone on subsequent hits beyond 3', () => {
    const pipe = makePipe(300);
    pipe.hitCount = 2;
    GameEngine.state.pipes = [pipe];

    // First hit → hitCount=3, brokenZone created at y=50
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    const originalZone = pipe.brokenZone;

    // Second hit → hitCount=4, brokenZone should remain unchanged
    GameEngine.state.bullets = [
      { worldX: 330, y: 80, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe.hitCount).toBe(4);
    expect(pipe.brokenZone).toBe(originalZone); // same object reference
  });

  // ---------------------------------------------------------------------------
  // Multiple bullets in one frame
  // ---------------------------------------------------------------------------

  it('handles multiple bullets hitting the same pipe in one frame', () => {
    const pipe = makePipe(300);
    GameEngine.state.pipes = [pipe];
    // Two bullets, both hitting the top pipe
    GameEngine.state.bullets = [
      { worldX: 310, y: 50, vx: 0, vy: 0, radius: 4 },
      { worldX: 340, y: 80, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    // Both should be removed
    expect(GameEngine.state.bullets).toHaveLength(0);
    // Both hits should be counted
    expect(pipe.hitCount).toBe(2);
  });

  it('does not affect pipes that are not hit', () => {
    const pipe1 = makePipe(300);  // hit zone
    const pipe2 = makePipe(100);  // not hit (bullet misses X range)
    GameEngine.state.pipes = [pipe1, pipe2];
    GameEngine.state.bullets = [
      { worldX: 330, y: 50, vx: 0, vy: 0, radius: 4 },
    ];
    GameEngine._updateBullets(16);
    expect(pipe2.hitCount).toBe(0);
    expect(pipe2.flashTimer).toBe(0);
    expect(pipe2.brokenZone).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GameEngine._updateScore() unit tests
// Requirements: 5.1, 5.2
// ---------------------------------------------------------------------------

describe('GameEngine._updateScore()', () => {
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  /** Build a minimal pipe object */
  function makePipe(worldX, scored = false) {
    return {
      worldX,
      width: 60,
      gapCenterY: 200,
      gapHeight: 150,
      gapDirection: 1,
      hitCount: 0,
      scored,
      flashTimer: 0,
      brokenZone: null,
    };
  }

  beforeEach(() => {
    GameEngine.init(makeMockCanvas(600, 400), {}, {});
    GameEngine.state.score = 0;
  });

  // --- Basic scoring ---

  it('increments score when ghost.worldX > pipe.worldX + pipe.width and pipe.scored is false', () => {
    const pipe = makePipe(100); // right edge at 160
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 200; // 200 > 160 ✓
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(1);
  });

  it('sets pipe.scored to true after scoring', () => {
    const pipe = makePipe(100);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 200;
    GameEngine._updateScore();
    expect(pipe.scored).toBe(true);
  });

  // --- Already scored (idempotency) ---

  it('does NOT increment score for a pipe already marked scored', () => {
    const pipe = makePipe(100, true); // already scored
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 200;
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(0);
  });

  it('does NOT score the same pipe twice across two calls', () => {
    const pipe = makePipe(100);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 200;
    GameEngine._updateScore();
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(1);
  });

  // --- Ghost has not cleared the pipe yet ---

  it('does NOT increment score when ghost.worldX equals pipe.worldX + pipe.width', () => {
    const pipe = makePipe(100); // right edge at 160
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 160; // equal, not greater
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(0);
  });

  it('does NOT increment score when ghost.worldX is before the pipe right edge', () => {
    const pipe = makePipe(100); // right edge at 160
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 50; // behind pipe
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(0);
  });

  // --- Multiple pipes ---

  it('scores multiple pipes in the same call when ghost has passed all of them', () => {
    const pipe1 = makePipe(50);  // right edge at 110
    const pipe2 = makePipe(200); // right edge at 260
    GameEngine.state.pipes = [pipe1, pipe2];
    GameEngine.state.ghost.worldX = 400; // past both
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(2);
    expect(pipe1.scored).toBe(true);
    expect(pipe2.scored).toBe(true);
  });

  it('scores only the pipes the ghost has passed (mixed state)', () => {
    const pipe1 = makePipe(50);  // right edge 110 — ghost past it
    const pipe2 = makePipe(500); // right edge 560 — ghost has NOT passed it
    GameEngine.state.pipes = [pipe1, pipe2];
    GameEngine.state.ghost.worldX = 300;
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(1);
    expect(pipe1.scored).toBe(true);
    expect(pipe2.scored).toBe(false);
  });

  it('skips pipes that are already scored among multiple pipes', () => {
    const pipe1 = makePipe(50, true);  // already scored
    const pipe2 = makePipe(200, false); // not yet scored
    GameEngine.state.pipes = [pipe1, pipe2];
    GameEngine.state.ghost.worldX = 400;
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(1); // only pipe2 counted
    expect(pipe1.scored).toBe(true);
    expect(pipe2.scored).toBe(true);
  });

  // --- Empty pipes list ---

  it('does nothing when there are no pipes', () => {
    GameEngine.state.pipes = [];
    GameEngine.state.ghost.worldX = 500;
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBe(0);
  });

  // --- Score only increases (monotonic) ---

  it('score never decreases across multiple calls', () => {
    const pipe1 = makePipe(50);
    const pipe2 = makePipe(200);
    GameEngine.state.pipes = [pipe1, pipe2];

    GameEngine.state.ghost.worldX = 200; // past pipe1 only
    GameEngine._updateScore();
    const scoreAfterFirst = GameEngine.state.score;

    GameEngine.state.ghost.worldX = 400; // past both
    GameEngine._updateScore();
    expect(GameEngine.state.score).toBeGreaterThanOrEqual(scoreAfterFirst);
  });

  it('spawns a heal power-up when score reaches nextHealScore', () => {
    GameEngine.state.nextHealScore = 1;
    const pipe = makePipe(100);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 200;

    GameEngine._updateScore();

    expect(GameEngine.state.powerUps).toHaveLength(1);
    expect(GameEngine.state.powerUps[0].type).toBe('heal');
  });

  it('schedules the next heal power-up 3 to 5 scores later', () => {
    GameEngine.state.nextHealScore = 1;
    const pipe = makePipe(100);
    GameEngine.state.pipes = [pipe];
    GameEngine.state.ghost.worldX = 200;

    GameEngine._updateScore();

    expect(GameEngine.state.nextHealScore).toBeGreaterThanOrEqual(4);
    expect(GameEngine.state.nextHealScore).toBeLessThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// GameEngine._updatePowerUps() unit tests
// ---------------------------------------------------------------------------

describe('GameEngine._updatePowerUps()', () => {
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  beforeEach(() => {
    GameEngine.init(makeMockCanvas(600, 400), {}, {});
    GameEngine.state.mode = 'playing';
    GameEngine.state.cameraX = 0;
    GameEngine.state.ghost.screenX = 200;
    GameEngine.state.ghost.y = 100;
    GameEngine.state.ghost.width = 40;
    GameEngine.state.ghost.height = 40;
    GameEngine.audioManager = { playHeal: vi.fn() };
  });

  it('heals one heart when ghost collects a heal power-up', () => {
    GameEngine.state.ghost.hp = 2;
    GameEngine.state.powerUps = [
      { type: 'heal', worldX: 210, y: 105, width: 34, height: 34 },
    ];

    GameEngine._updatePowerUps();

    expect(GameEngine.state.ghost.hp).toBe(3);
    expect(GameEngine.state.powerUps).toHaveLength(0);
    expect(GameEngine.audioManager.playHeal).toHaveBeenCalledTimes(1);
  });

  it('does not exceed full health when collecting a heal power-up', () => {
    GameEngine.state.ghost.hp = 3;
    GameEngine.state.powerUps = [
      { type: 'heal', worldX: 210, y: 105, width: 34, height: 34 },
    ];

    GameEngine._updatePowerUps();

    expect(GameEngine.state.ghost.hp).toBe(3);
    expect(GameEngine.state.powerUps).toHaveLength(0);
    expect(GameEngine.audioManager.playHeal).toHaveBeenCalledTimes(1);
  });

  it('keeps a heal power-up when it has not been collected', () => {
    GameEngine.state.ghost.hp = 2;
    GameEngine.state.powerUps = [
      { type: 'heal', worldX: 500, y: 300, width: 34, height: 34 },
    ];

    GameEngine._updatePowerUps();

    expect(GameEngine.state.ghost.hp).toBe(2);
    expect(GameEngine.state.powerUps).toHaveLength(1);
    expect(GameEngine.audioManager.playHeal).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GameEngine._checkCollisions() unit tests
// Requirements: 4.1, 4.2, 4.4, 4.5
// ---------------------------------------------------------------------------

describe('GameEngine._checkCollisions()', () => {
  /** Minimal mock canvas 600×400 */
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  /**
   * Build a pipe whose gap is far away from ghost so we can control
   * exactly which part of the pipe the ghost overlaps.
   *   gapCenterY = 200, gapHeight = 150
   *   top pipe:    y ∈ [0,   125]
   *   bottom pipe: y ∈ [275, 400]
   */
  function makePipe(worldX = 200, extra = {}) {
    return {
      worldX,
      width: 60,
      gapCenterY: 200,
      gapHeight: 150,
      gapDirection: 1,
      hitCount: 0,
      scored: false,
      flashTimer: 0,
      brokenZone: null,
      ...extra,
    };
  }

  /**
   * Place the ghost so its AABB overlaps the top pipe of the given pipe.
   * ghost.screenX is used as the fixed screen position.
   *   top pipe covers y ∈ [0, 125]
   *   ghost rect: [screenX, screenX+40] × [y, y+40]
   */
  function placeGhostAtTopPipeOverlap(ghost, pipe, cameraX) {
    // Screen X of pipe
    const pipeScreenX = pipe.worldX - cameraX;
    ghost.screenX = pipeScreenX + 10; // inside pipe X range
    ghost.y = 50;                     // inside top-pipe Y range [0,125]
  }

  function placeGhostAtBottomPipeOverlap(ghost, pipe, cameraX) {
    const pipeScreenX = pipe.worldX - cameraX;
    ghost.screenX = pipeScreenX + 10;
    ghost.y = 280; // inside bottom-pipe Y range [275, 400]
  }

  function placeGhostAtGap(ghost, pipe, cameraX) {
    const pipeScreenX = pipe.worldX - cameraX;
    ghost.screenX = pipeScreenX + 10;
    ghost.y = 160; // inside gap Y range [125, 275]
  }

  beforeEach(() => {
    GameEngine.init(makeMockCanvas(600, 400), {}, {});
    GameEngine.triggerGameOver = vi.fn();
    // cameraX = 0 for simplicity
    GameEngine.state.cameraX = 0;
    // Ensure ghost starts non-invincible with full HP
    GameEngine.state.ghost.invincible = false;
    GameEngine.state.ghost.invincibleTimer = 0;
    GameEngine.state.ghost.hp = 3;
    GameEngine.state.ghost.width = 40;
    GameEngine.state.ghost.height = 40;
    GameEngine.state.ghost.blinkTimer = 0;
  });

  // --- No collision when ghost is in the gap ---

  it('does not deduct HP when ghost passes through the gap', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtGap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.hp).toBe(3);
  });

  it('does not trigger invincibility when ghost passes through the gap', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtGap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.invincible).toBe(false);
  });

  // --- Collision with top pipe ---

  it('deducts 1 HP when ghost overlaps top pipe (not invincible)', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtTopPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.hp).toBe(2);
  });

  it('sets invincible=true and invincibleTimer=500 on top-pipe hit', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtTopPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.invincible).toBe(true);
    expect(GameEngine.state.ghost.invincibleTimer).toBe(500);
  });

  it('sets blinkTimer=100 on top-pipe hit', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtTopPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.blinkTimer).toBe(100);
  });

  // --- Collision with bottom pipe ---

  it('deducts 1 HP when ghost overlaps bottom pipe (not invincible)', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtBottomPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.hp).toBe(2);
  });

  it('sets invincible=true on bottom-pipe hit', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtBottomPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.invincible).toBe(true);
  });

  // --- Invincibility prevents damage (Requirement 4.2) ---

  it('does NOT deduct HP when ghost is already invincible', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtTopPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 300;
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.hp).toBe(3);
  });

  it('does NOT reset invincibleTimer when already invincible and colliding', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtTopPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 300;
    GameEngine._checkCollisions();
    // Timer should remain 300, not be reset to 500
    expect(GameEngine.state.ghost.invincibleTimer).toBe(300);
  });

  // --- HP depletion triggers Game Over (Requirement 4.4) ---

  it('calls triggerGameOver() when HP reaches 0', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtTopPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine.state.ghost.hp = 1;
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.hp).toBe(0);
    expect(GameEngine.triggerGameOver).toHaveBeenCalled();
  });

  it('does NOT call triggerGameOver() when HP is still > 0 after hit', () => {
    const pipe = makePipe(200);
    GameEngine.state.pipes = [pipe];
    placeGhostAtTopPipeOverlap(GameEngine.state.ghost, pipe, GameEngine.state.cameraX);
    GameEngine.state.ghost.hp = 3;
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.hp).toBe(2);
    expect(GameEngine.triggerGameOver).not.toHaveBeenCalled();
  });

  // --- Destroyed block exemption ---

  it('does NOT deduct HP when ghost overlaps destroyed blocker squares', () => {
    const pipe = makePipe(200);
    const cameraX = 0;
    const pipeScreenX = pipe.worldX - cameraX;
    const ghost = GameEngine.state.ghost;
    ghost.screenX = pipeScreenX + 10; // ghost left at pipeScreenX+10
    ghost.y = 40;                     // ghost top at 40
    GameEngine._ensurePipeBlocks(pipe);
    for (const block of pipe.blocks) {
      const y = GameEngine._getBlockY(pipe, block);
      const overlapsGhost = ghost.y + ghost.height > y && ghost.y < y + block.size;
      if (overlapsGhost) block.active = false;
    }
    GameEngine.state.pipes = [pipe];
    GameEngine._checkCollisions();
    expect(ghost.hp).toBe(3);
    expect(ghost.invincible).toBe(false);
  });

  it('DOES deduct HP when ghost does not overlap the rectangular broken zone', () => {
    const pipe = makePipe(200);
    const cameraX = 0;
    const pipeScreenX = pipe.worldX - cameraX;
    const ghost = GameEngine.state.ghost;
    ghost.screenX = pipeScreenX + 10;
    ghost.y = 40;
    // ghost centre: (pipeScreenX+30, 60)
    // broken zone centred at localX=30, localY=200 — far from ghost centre
    pipe.brokenZone = {
      localX: 30,
      localY: 200,
      width: 60,
      height: 20,
    };
    GameEngine.state.pipes = [pipe];
    GameEngine._checkCollisions();
    expect(ghost.hp).toBe(2);
  });

  it('deducts HP when ghost overlaps solid pipe below a rectangular broken zone', () => {
    const pipe = makePipe(200);
    const pipeScreenX = pipe.worldX;
    const ghost = GameEngine.state.ghost;
    ghost.screenX = pipeScreenX + 10;
    ghost.y = 105;
    pipe.brokenZone = {
      localX: 30,
      localY: 60,
      width: 60,
      height: 80,
    };
    GameEngine.state.pipes = [pipe];
    GameEngine._checkCollisions();
    expect(ghost.hp).toBe(2);
  });

  // --- No pipes: no collision ---

  it('does nothing when there are no pipes', () => {
    GameEngine.state.pipes = [];
    GameEngine._checkCollisions();
    expect(GameEngine.state.ghost.hp).toBe(3);
    expect(GameEngine.state.ghost.invincible).toBe(false);
    expect(GameEngine.triggerGameOver).not.toHaveBeenCalled();
  });

  // --- Ghost entirely to the left of pipe: no collision ---

  it('does not collide when ghost is to the left of the pipe', () => {
    const pipe = makePipe(500); // pipe at screen X 500
    const ghost = GameEngine.state.ghost;
    ghost.screenX = 100; // ghost at screen X 100, pipe at 500 — no overlap
    ghost.y = 50;        // inside top-pipe Y range but X does not overlap
    GameEngine.state.pipes = [pipe];
    GameEngine._checkCollisions();
    expect(ghost.hp).toBe(3);
  });

  // --- Ghost entirely to the right of pipe: no collision ---

  it('does not collide when ghost is to the right of the pipe', () => {
    const pipe = makePipe(100); // pipe covers screen X [100, 160]
    const ghost = GameEngine.state.ghost;
    ghost.screenX = 300;  // ghost left at 300 — past pipe's right edge
    ghost.y = 50;
    GameEngine.state.pipes = [pipe];
    GameEngine._checkCollisions();
    expect(ghost.hp).toBe(3);
  });

  // --- cameraX offset applied correctly ---

  it('accounts for cameraX when computing pipe screen position', () => {
    // pipe.worldX=500, cameraX=300 → pipeScreenX=200
    GameEngine.state.cameraX = 300;
    const pipe = makePipe(500); // screen X = 500-300 = 200
    const ghost = GameEngine.state.ghost;
    ghost.screenX = 210; // overlaps pipe screen X [200, 260]
    ghost.y = 50;        // inside top-pipe Y range [0, 125]
    GameEngine.state.pipes = [pipe];
    GameEngine._checkCollisions();
    expect(ghost.hp).toBe(2); // should have been hit
  });
});

// ---------------------------------------------------------------------------
// GameEngine.triggerGameOver() unit tests
// Requirements: 5.4, 6.1
// ---------------------------------------------------------------------------

describe('GameEngine.triggerGameOver()', () => {
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  function makeMockAudio() {
    return {
      playJump: vi.fn(),
      playGameOver: vi.fn(),
    };
  }

  let mockAudio;

  beforeEach(() => {
    localStorage.clear();
    mockAudio = makeMockAudio();
    // Restore the real implementation in case a previous suite replaced it with vi.fn()
    GameEngine.triggerGameOver = _realTriggerGameOver;
    GameEngine.init(makeMockCanvas(), mockAudio, {});
  });

  // --- state.mode (Requirement 6.1) ---

  it('sets state.mode to "gameover"', () => {
    GameEngine.state.mode = 'playing';
    GameEngine.triggerGameOver();
    expect(GameEngine.state.mode).toBe('gameover');
  });

  // --- Audio (Requirement 6.1) ---

  it('calls audioManager.playGameOver()', () => {
    GameEngine.triggerGameOver();
    expect(mockAudio.playGameOver).toHaveBeenCalledOnce();
  });

  // --- High score update (Requirement 5.4) ---

  it('updates highScore when score > highScore', () => {
    GameEngine.state.score = 10;
    GameEngine.state.highScore = 5;
    GameEngine.triggerGameOver();
    expect(GameEngine.state.highScore).toBe(10);
  });

  it('does NOT update highScore when score equals highScore', () => {
    GameEngine.state.score = 5;
    GameEngine.state.highScore = 5;
    GameEngine.triggerGameOver();
    expect(GameEngine.state.highScore).toBe(5);
  });

  it('does NOT update highScore when score < highScore', () => {
    GameEngine.state.score = 3;
    GameEngine.state.highScore = 10;
    GameEngine.triggerGameOver();
    expect(GameEngine.state.highScore).toBe(10);
  });

  // --- localStorage persistence (Requirement 5.4) ---

  it('writes highScore to localStorage when score > highScore', () => {
    GameEngine.state.score = 15;
    GameEngine.state.highScore = 7;
    GameEngine.triggerGameOver();
    expect(localStorage.getItem('kiro_ghost_highscore')).toBe('15');
  });

  it('does NOT write to localStorage when score does not exceed highScore', () => {
    GameEngine.state.score = 3;
    GameEngine.state.highScore = 10;
    GameEngine.triggerGameOver();
    // localStorage should remain empty since init cleared it and no write occurred
    expect(localStorage.getItem('kiro_ghost_highscore')).toBeNull();
  });

  it('keeps in-memory highScore correct even when localStorage.setItem throws', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('localStorage full');
    });

    GameEngine.state.score = 20;
    GameEngine.state.highScore = 5;

    // Should not throw
    expect(() => GameEngine.triggerGameOver()).not.toThrow();

    // In-memory highScore should still be updated
    expect(GameEngine.state.highScore).toBe(20);

    vi.restoreAllMocks();
  });

  it('silently handles localStorage.setItem failure (no thrown exception)', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded');
    });

    GameEngine.state.score = 50;
    GameEngine.state.highScore = 0;

    expect(() => GameEngine.triggerGameOver()).not.toThrow();
    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// GameEngine.reset() unit tests
// Requirements: 6.3, 6.4
// ---------------------------------------------------------------------------

describe('GameEngine.reset()', () => {
  /** Build a minimal mock canvas */
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  const mockAudioManager = { playJump: vi.fn(), playGameOver: vi.fn() };
  const mockRenderer = {};

  beforeEach(() => {
    // Initialise with known canvas so screenX and initial positions are set
    GameEngine.init(makeMockCanvas(600, 400), mockAudioManager, mockRenderer);
    // Stub triggerGameOver so physics tests don't interfere
    GameEngine.triggerGameOver = vi.fn();
  });

  // --- mode ---

  it('sets mode to "playing" after reset', () => {
    GameEngine.state.mode = 'gameover';
    GameEngine.reset();
    expect(GameEngine.state.mode).toBe('playing');
  });

  // --- ghost position ---

  it('resets ghost.worldX to ghost.screenX', () => {
    GameEngine.state.ghost.worldX = 9999;
    GameEngine.reset();
    expect(GameEngine.state.ghost.worldX).toBe(GameEngine.state.ghost.screenX);
  });

  it('resets ghost.y to canvas.height / 2', () => {
    GameEngine.state.ghost.y = 0;
    GameEngine.reset();
    expect(GameEngine.state.ghost.y).toBe(GameEngine.canvas.height / 2);
  });

  it('resets ghost.vy to 0', () => {
    GameEngine.state.ghost.vy = -6;
    GameEngine.reset();
    expect(GameEngine.state.ghost.vy).toBe(0);
  });

  // --- ghost HP ---

  it('resets ghost.hp to 3', () => {
    GameEngine.state.ghost.hp = 0;
    GameEngine.reset();
    expect(GameEngine.state.ghost.hp).toBe(3);
  });

  // --- ghost invincibility ---

  it('resets ghost.invincible to false', () => {
    GameEngine.state.ghost.invincible = true;
    GameEngine.reset();
    expect(GameEngine.state.ghost.invincible).toBe(false);
  });

  it('resets ghost.invincibleTimer to 0', () => {
    GameEngine.state.ghost.invincibleTimer = 300;
    GameEngine.reset();
    expect(GameEngine.state.ghost.invincibleTimer).toBe(0);
  });

  it('resets ghost.blinkVisible to true', () => {
    GameEngine.state.ghost.blinkVisible = false;
    GameEngine.reset();
    expect(GameEngine.state.ghost.blinkVisible).toBe(true);
  });

  it('resets ghost.blinkTimer to 0', () => {
    GameEngine.state.ghost.blinkTimer = 50;
    GameEngine.reset();
    expect(GameEngine.state.ghost.blinkTimer).toBe(0);
  });

  // --- pipes and bullets ---

  it('resets pipes to an empty array', () => {
    GameEngine.state.pipes = [{ worldX: 400 }, { worldX: 600 }];
    GameEngine.reset();
    expect(GameEngine.state.pipes).toEqual([]);
  });

  it('resets bullets to an empty array', () => {
    GameEngine.state.bullets = [{ worldX: 200, y: 100 }];
    GameEngine.reset();
    expect(GameEngine.state.bullets).toEqual([]);
  });

  // --- score ---

  it('resets score to 0', () => {
    GameEngine.state.score = 42;
    GameEngine.reset();
    expect(GameEngine.state.score).toBe(0);
  });

  // --- highScore is preserved ---

  it('preserves highScore after reset', () => {
    GameEngine.state.highScore = 99;
    GameEngine.reset();
    expect(GameEngine.state.highScore).toBe(99);
  });

  it('preserves highScore even when score was higher before reset', () => {
    GameEngine.state.highScore = 50;
    GameEngine.state.score = 75;
    GameEngine.reset();
    expect(GameEngine.state.highScore).toBe(50);
    expect(GameEngine.state.score).toBe(0);
  });

  // --- speed and timers ---

  it('resets pipeSpeed to 2', () => {
    GameEngine.state.pipeSpeed = 6;
    GameEngine.reset();
    expect(GameEngine.state.pipeSpeed).toBe(2);
  });

  it('resets speedTimer to 0', () => {
    GameEngine.state.speedTimer = 4000;
    GameEngine.reset();
    expect(GameEngine.state.speedTimer).toBe(0);
  });

  it('resets elapsedTime to 0', () => {
    GameEngine.state.elapsedTime = 90000;
    GameEngine.reset();
    expect(GameEngine.state.elapsedTime).toBe(0);
  });

  it('resets spawnTimer to 0', () => {
    GameEngine.state.spawnTimer = 1200;
    GameEngine.reset();
    expect(GameEngine.state.spawnTimer).toBe(0);
  });

  it('resets cameraX to 0', () => {
    GameEngine.state.cameraX = 9999;
    GameEngine.reset();
    expect(GameEngine.state.cameraX).toBe(0);
  });

  // --- lastTimestamp ---

  it('resets lastTimestamp to 0', () => {
    GameEngine.lastTimestamp = 12345;
    GameEngine.reset();
    expect(GameEngine.lastTimestamp).toBe(0);
  });

  // --- state independence (reset from any state produces same result) ---

  it('produces identical state regardless of prior gameplay state', () => {
    // Dirty the state heavily
    GameEngine.state.mode = 'gameover';
    GameEngine.state.ghost.worldX = 5000;
    GameEngine.state.ghost.y = 350;
    GameEngine.state.ghost.vy = 8;
    GameEngine.state.ghost.hp = 0;
    GameEngine.state.ghost.invincible = true;
    GameEngine.state.ghost.invincibleTimer = 200;
    GameEngine.state.ghost.blinkVisible = false;
    GameEngine.state.ghost.blinkTimer = 75;
    GameEngine.state.pipes = [{ worldX: 700 }];
    GameEngine.state.bullets = [{ worldX: 300, y: 100 }];
    GameEngine.state.score = 15;
    GameEngine.state.highScore = 30;
    GameEngine.state.pipeSpeed = 5.5;
    GameEngine.state.elapsedTime = 90000;
    GameEngine.state.speedTimer = 3000;
    GameEngine.state.spawnTimer = 800;
    GameEngine.state.cameraX = 4800;
    GameEngine.lastTimestamp = 50000;

    GameEngine.reset();

    expect(GameEngine.state.mode).toBe('playing');
    expect(GameEngine.state.ghost.worldX).toBe(GameEngine.state.ghost.screenX);
    expect(GameEngine.state.ghost.y).toBe(GameEngine.canvas.height / 2);
    expect(GameEngine.state.ghost.vy).toBe(0);
    expect(GameEngine.state.ghost.hp).toBe(3);
    expect(GameEngine.state.ghost.invincible).toBe(false);
    expect(GameEngine.state.ghost.invincibleTimer).toBe(0);
    expect(GameEngine.state.ghost.blinkVisible).toBe(true);
    expect(GameEngine.state.ghost.blinkTimer).toBe(0);
    expect(GameEngine.state.pipes).toEqual([]);
    expect(GameEngine.state.bullets).toEqual([]);
    expect(GameEngine.state.score).toBe(0);
    expect(GameEngine.state.highScore).toBe(30); // preserved
    expect(GameEngine.state.pipeSpeed).toBe(2);
    expect(GameEngine.state.elapsedTime).toBe(0);
    expect(GameEngine.state.speedTimer).toBe(0);
    expect(GameEngine.state.spawnTimer).toBe(0);
    expect(GameEngine.state.cameraX).toBe(0);
    expect(GameEngine.lastTimestamp).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Renderer.render() and GameEngine.update() integration tests
// Requirements: 6.2, 8.4
// ---------------------------------------------------------------------------

describe('Renderer.render()', () => {
  beforeEach(() => {
    Renderer.canvas = { width: 480, height: 640 };
    Renderer.ctx = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeRenderState(mode = 'playing') {
    return {
      mode,
      cameraX: 12,
      ghost: { hp: 3 },
      pipes: [{ worldX: 100 }],
      bullets: [{ worldX: 50 }],
      powerUps: [],
      score: 4,
      highScore: 9,
    };
  }

  it('draws the active game layers in order', () => {
    const calls = [];
    vi.spyOn(Renderer, '_drawBackground').mockImplementation(() => calls.push('background'));
    vi.spyOn(Renderer, '_drawPipes').mockImplementation(() => calls.push('pipes'));
    vi.spyOn(Renderer, '_drawPowerUps').mockImplementation(() => calls.push('powerups'));
    vi.spyOn(Renderer, '_drawBullets').mockImplementation(() => calls.push('bullets'));
    vi.spyOn(Renderer, '_drawGhost').mockImplementation(() => calls.push('ghost'));
    vi.spyOn(Renderer, '_drawHUD').mockImplementation(() => calls.push('hud'));
    vi.spyOn(Renderer, '_drawSoundToggle').mockImplementation(() => calls.push('sound'));
    vi.spyOn(Renderer, '_drawStartScreen').mockImplementation(() => calls.push('start'));
    vi.spyOn(Renderer, '_drawPauseScreen').mockImplementation(() => calls.push('pause'));
    vi.spyOn(Renderer, '_drawGameOver').mockImplementation(() => calls.push('gameover'));

    Renderer.render(makeRenderState('playing'));

    expect(calls).toEqual(['background', 'pipes', 'powerups', 'bullets', 'ghost', 'hud', 'sound']);
  });

  it('draws the Game Over overlay when state.mode is gameover', () => {
    vi.spyOn(Renderer, '_drawBackground').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawPipes').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawPowerUps').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawBullets').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawGhost').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawHUD').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawSoundToggle').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawStartScreen').mockImplementation(() => {});
    vi.spyOn(Renderer, '_drawPauseScreen').mockImplementation(() => {});
    const drawGameOver = vi.spyOn(Renderer, '_drawGameOver').mockImplementation(() => {});

    Renderer.render(makeRenderState('gameover'));

    expect(drawGameOver).toHaveBeenCalledWith(4);
  });
});

describe('GameEngine.update()', () => {
  function makeMockCanvas(width = 600, height = 400) {
    return { width, height };
  }

  let mockRenderer;

  beforeEach(() => {
    KeyboardInput.keysDown.clear();
    KeyboardInput.keysPressed.clear();
    mockRenderer = { render: vi.fn() };
    GameEngine.init(
      makeMockCanvas(),
      {
        playJump: vi.fn(),
        playGameOver: vi.fn(),
        playBgm: vi.fn(),
        stopBgm: vi.fn(),
        toggleMuted: vi.fn(() => false),
        muted: false,
      },
      mockRenderer,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates gameplay systems and renders once while playing', () => {
    GameEngine.state.mode = 'playing';
    const calls = [];
    vi.spyOn(GameEngine, '_updateGhost').mockImplementation(() => calls.push('ghost'));
    vi.spyOn(GameEngine, '_updatePipes').mockImplementation(() => calls.push('pipes'));
    vi.spyOn(GameEngine, '_updateBullets').mockImplementation(() => calls.push('bullets'));
    vi.spyOn(GameEngine, '_checkCollisions').mockImplementation(() => calls.push('collisions'));
    vi.spyOn(GameEngine, '_updateScore').mockImplementation(() => calls.push('score'));
    vi.spyOn(GameEngine, '_updateSpeed').mockImplementation(() => calls.push('speed'));

    GameEngine.update(100);

    expect(calls).toEqual(['ghost', 'pipes', 'bullets', 'collisions', 'score', 'speed']);
    expect(mockRenderer.render).toHaveBeenCalledOnce();
    expect(mockRenderer.render).toHaveBeenCalledWith(GameEngine.state);
  });

  it('waits on the start screen until any key is pressed', () => {
    GameEngine.state.mode = 'start';
    const updateGhost = vi.spyOn(GameEngine, '_updateGhost');

    GameEngine.update(100);

    expect(updateGhost).not.toHaveBeenCalled();
    expect(GameEngine.state.mode).toBe('start');
    expect(mockRenderer.render).toHaveBeenCalledOnce();
  });

  it('starts the game from the start screen when any key is pressed', () => {
    GameEngine.state.mode = 'start';
    KeyboardInput.keysPressed.add('ArrowUp');
    const playBgm = vi.spyOn(GameEngine.audioManager, 'playBgm');

    GameEngine.update(100);

    expect(GameEngine.state.mode).toBe('playing');
    expect(playBgm).toHaveBeenCalledOnce();
    expect(mockRenderer.render).toHaveBeenCalledOnce();
  });

  it('renders Game Over without advancing gameplay systems', () => {
    GameEngine.state.mode = 'gameover';
    const updateGhost = vi.spyOn(GameEngine, '_updateGhost');

    GameEngine.update(100);

    expect(updateGhost).not.toHaveBeenCalled();
    expect(mockRenderer.render).toHaveBeenCalledOnce();
  });

  it('pauses the game when Enter is pressed while playing', () => {
    GameEngine.state.mode = 'playing';
    KeyboardInput.keysPressed.add('Enter');

    GameEngine.update(100);

    expect(GameEngine.state.mode).toBe('paused');
    expect(GameEngine.audioManager.stopBgm).toHaveBeenCalledOnce();
    expect(mockRenderer.render).toHaveBeenCalledOnce();
  });

  it('resumes the game when Enter is pressed while paused', () => {
    GameEngine.state.mode = 'paused';
    KeyboardInput.keysPressed.add('Enter');

    GameEngine.update(100);

    expect(GameEngine.state.mode).toBe('playing');
    expect(GameEngine.audioManager.playBgm).toHaveBeenCalledOnce();
    expect(mockRenderer.render).toHaveBeenCalledOnce();
  });

  it('resets from Game Over when Space is pressed', () => {
    GameEngine.state.mode = 'gameover';
    GameEngine.state.score = 8;
    KeyboardInput.keysPressed.add(' ');

    GameEngine.update(100);

    expect(GameEngine.state.mode).toBe('playing');
    expect(GameEngine.state.score).toBe(0);
    expect(mockRenderer.render).toHaveBeenCalledOnce();
  });
});
