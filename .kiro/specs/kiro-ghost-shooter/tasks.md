# Implementation Plan: Kiro Ghost Shooter

## Overview

以 HTML5 Canvas + 原生 JavaScript（ES2020+）實作橫向捲軸射擊遊戲。實作分為六個階段：專案骨架與測試環境、核心物理與輸入、水管障礙物系統、子彈與破損區域、血量與計分系統、遊戲流程整合。所有模組（GameEngine、Renderer、AudioManager、KeyboardInput）以物件字面值形式定義於 `game.js`，透過 Vitest + fast-check 執行單元測試與屬性測試。

---

## Tasks

- [x] 1. 建立專案骨架與測試環境
  - 建立 `index.html`（Canvas 元素、載入 `game.js`、`style.css`）
  - 建立 `style.css`（全版面置中 Canvas、背景黑色）
  - 建立 `game.js` 骨架：匯出 `GameEngine`、`Renderer`、`AudioManager`、`KeyboardInput` 物件，所有方法以空函式佔位
  - 建立 `package.json`，加入 Vitest 與 fast-check 依賴；設定 `vitest.config.js`（環境：jsdom）
  - 建立測試入口檔案 `tests/game.test.js`，匯入各模組
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. 實作 KeyboardInput 與 AudioManager
  - [x] 2.1 實作 `KeyboardInput`
    - 實作 `init()`：註冊 `keydown`/`keyup` 事件監聽器，維護 `keysDown` 與 `keysPressed` 兩個 Set
    - 實作 `isDown(key): boolean`
    - 實作 `consumePressed(key): boolean`（讀取後從 Set 移除）
    - _Requirements: 1.3, 3.1, 6.3_

  - [x] 2.2 實作 `AudioManager`
    - 實作 `init()`：預載 `assets/jump.wav`、`assets/game_over.wav`，所有錯誤以 try/catch 靜默處理
    - 實作 `playJump()`：currentTime 歸零後 play()，以 try/catch 包裹
    - 實作 `playGameOver()`：play()，以 try/catch 包裹
    - _Requirements: 7.1, 7.2_

  - [ ]* 2.3 針對 AudioManager 撰寫屬性測試
    - **Property 13: 音效錯誤靜默處理**
    - **Validates: Requirements 7.2**
    - mock `HTMLAudioElement.play()` 使其拋出任意錯誤，驗證例外不向上傳播且呼叫前後遊戲狀態不受影響

- [x] 3. 實作幽靈物理核心（GameEngine 子集）
  - [x] 3.1 實作 `GameEngine.init()` 與 `GameState` 初始化
    - 初始化 `state` 物件（ghost、pipes、bullets、score、highScore、pipeSpeed、timers）
    - 從 `localStorage.getItem('kiro_ghost_highscore')` 讀取歷史最高分，失敗則預設 0
    - 儲存 canvas、audioManager、renderer 參照；計算 `ghost.screenX = canvas.width / 3`
    - _Requirements: 5.5, 8.1_

  - [x] 3.2 實作 `GameEngine._updateGhost(dt)`
    - 施加重力：`ghost.vy += 0.4`（每影格，與 dt 無關）
    - 更新位置：`ghost.y += ghost.vy`；`ghost.worldX += 3`
    - 上邊界鉗制：若 `ghost.y < 0` 則 `ghost.y = 0; ghost.vy = 0`
    - 下邊界：若 `ghost.y + ghost.height > canvas.height` 則呼叫 `triggerGameOver()`
    - 處理跳躍輸入（`KeyboardInput.consumePressed('ArrowUp')`）：`ghost.vy = -6`，播放跳躍音效
    - 更新無敵計時器與閃爍計時器
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1_

  - [ ]* 3.3 針對重力與跳躍撰寫屬性測試
    - **Property 1: 重力持續累積**
    - **Validates: Requirements 1.2**
    - 生成任意初始 vy 與影格數 N，執行 N 次不含跳躍的更新，驗證 `vy_final = vy_initial + 0.4 * N`

  - [ ]* 3.4 針對跳躍速度重置撰寫屬性測試
    - **Property 2: 跳躍重置速度**
    - **Validates: Requirements 1.3**
    - 生成任意初始 vy（正、負、零），呼叫跳躍邏輯，驗證結果恆為 −6

  - [ ]* 3.5 針對上邊界鉗制撰寫屬性測試
    - **Property 3: 上邊界鉗制**
    - **Validates: Requirements 1.5**
    - 生成任意負 Y 位置（y < 0），執行更新後驗證 `ghost.y === 0` 且 `ghost.vy === 0`

- [x] 4. 實作水管障礙物系統
  - [x] 4.1 實作 `GameEngine._updatePipes(dt)` 與 `_spawnPipe()`
    - `_spawnPipe()`：建立 PipeObject，`worldX = ghost.worldX + canvas.width`，隨機初始 `gapCenterY`（滿足 `80 + 75 ≤ gapCenterY ≤ canvasHeight − 80 − 75`），`gapDirection = Math.random() < 0.5 ? 1 : -1`
    - `_updatePipes(dt)`：每影格將所有水管 `worldX -= pipeSpeed`；振盪 `gapCenterY`（+= gapDirection * 1），觸碰邊界時反向；移除畫面外水管；計時器達 1500ms 後呼叫 `_spawnPipe()`
    - 更新 `state.cameraX = ghost.worldX - ghost.screenX`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 實作 `GameEngine._updateSpeed(dt)`
    - 每幀累加 `state.speedTimer += dt`；每達 5000ms 將 `pipeSpeed = Math.min(pipeSpeed + 0.5, 6)`
    - _Requirements: 2.5_

  - [ ]* 4.3 針對縫隙安全距離撰寫屬性測試
    - **Property 4: 縫隙中心安全距離不變式**
    - **Validates: Requirements 2.3**
    - 生成任意影格數，執行振盪更新，驗證每幀後 `80 + 75 ≤ gapCenterY ≤ canvasHeight − 80 − 75`

  - [ ]* 4.4 針對水管速度遞增撰寫屬性測試
    - **Property 5: 水管速度遞增上限**
    - **Validates: Requirements 2.5**
    - 生成任意時間 T（秒），驗證 `speed === Math.min(2 + Math.floor(T / 5) * 0.5, 6)` 且速度不超過 6

- [x] 5. 實作子彈系統與破損區域
  - [x] 5.1 實作 `GameEngine._updateBullets(dt)`
    - 處理空白鍵輸入（`consumePressed(' ')`）：於幽靈中心生成八顆 BulletObject，速度向量依設計文件角度表
    - 每影格更新所有子彈位置（`worldX += vx; y += vy`）
    - 移除畫面外（含世界座標換算後超出 canvas 邊界）的子彈
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 5.2 針對子彈速度向量撰寫屬性測試
    - **Property 6: 子彈速度向量正確性**
    - **Validates: Requirements 3.1**
    - 生成發射事件，驗證八顆子彈中每顆 `Math.sqrt(vx*vx + vy*vy) ≈ 8`（容差 0.01），且八個角度完整覆蓋 0°、45°、90°、135°、180°、225°、270°、315°

  - [x] 5.3 實作子彈與水管碰撞及破損區域建立
    - AABB 碰撞：子彈圓心落在水管矩形（上管或下管）內時判定命中
    - 命中後：移除子彈、`pipe.hitCount++`、記錄命中座標、設 `pipe.flashTimer = 50 + Math.random() * 250`
    - 當 `hitCount === 3`：建立 BrokenZone（`localX`、`localY` 為命中的本地座標，`radius = 1.5 * ghost.width`）
    - _Requirements: 3.4, 3.5, 3.6_

  - [ ]* 5.4 針對命中計數累積撰寫屬性測試
    - **Property 8: 命中計數累積正確性**
    - **Validates: Requirements 3.4, 3.6**
    - 生成命中序列（1–5 次），驗證 `hitCount` 正確遞增，且 `brokenZone` 僅在第三次命中後建立一次、不重複建立

  - [ ]* 5.5 針對破損區域免傷撰寫屬性測試
    - **Property 7: 破損區域免傷不變式**
    - **Validates: Requirements 3.6, 4.5**
    - 生成幽靈位置落於破損區域圓形範圍內的場景，執行碰撞偵測，驗證血量不減少且不觸發無敵時間

- [x] 6. 實作碰撞偵測（幽靈 vs 水管）與血量系統
  - [x] 6.1 實作 `GameEngine._checkCollisions()`
    - 計算各水管在畫面座標的矩形（上管、下管）
    - AABB 碰撞：幽靈矩形與上管或下管重疊時進入命中流程
    - 命中流程：若幽靈中心在該管破損區域圓形內則跳過（免傷）；否則若非無敵狀態則 `ghost.hp--`、啟動無敵（`invincible = true; invincibleTimer = 500`）
    - 若 `ghost.hp <= 0` 則呼叫 `triggerGameOver()`
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ]* 6.2 針對無敵期間不扣血撰寫屬性測試
    - **Property 9: 無敵期間不扣血**
    - **Validates: Requirements 4.2**
    - 生成 `invincible === true` 的幽靈狀態與任意碰撞事件，執行 `_checkCollisions()`，驗證血量不變且無敵計時器不被重設

- [x] 7. 實作計分系統與 LocalStorage
  - [x] 7.1 實作 `GameEngine._updateScore()`
    - 計分條件：`ghost.worldX > pipe.worldX + pipe.width` 且 `pipe.scored === false`
    - 計分後設 `pipe.scored = true`，`state.score++`
    - _Requirements: 5.1, 5.2_

  - [ ]* 7.2 針對計分單調遞增撰寫屬性測試
    - **Property 10: 計分單調遞增且每管唯一**
    - **Validates: Requirements 5.2**
    - 生成任意通管序列，執行計分邏輯，驗證分數只增不減，且同一水管物件的 `scored` 旗標確保只計分一次

  - [x] 7.3 實作 `GameEngine.triggerGameOver()`
    - 設 `state.mode = 'gameover'`
    - 若 `score > highScore`：`highScore = score`；try/catch 包裹 `localStorage.setItem('kiro_ghost_highscore', highScore)`，失敗則靜默
    - 呼叫 `audioManager.playGameOver()`
    - _Requirements: 5.4, 6.1_

  - [ ]* 7.4 針對最高分持久化撰寫屬性測試
    - **Property 11: 最高分持久化 round-trip**
    - **Validates: Requirements 5.4, 5.5**
    - mock localStorage，生成任意分數（高於或低於現有最高分），驗證寫入後立即讀取值相符；模擬 `setItem` 拋出例外，驗證記憶體中 `highScore` 維持正確值

- [x] 8. 實作重置流程
  - [x] 8.1 實作 `GameEngine.reset()`
    - 重設所有 `state` 欄位回初始值（ghost 位置、hp=3、score=0、pipes=[]、bullets=[]、pipeSpeed=2、timers=0）
    - `state.mode = 'playing'`
    - 保留 `highScore`（不重置）
    - _Requirements: 6.3, 6.4_

  - [ ]* 8.2 針對重置完整性撰寫屬性測試
    - **Property 12: 重置後狀態完整性**
    - **Validates: Requirements 6.3, 6.4**
    - 生成任意遊戲狀態（隨機 hp、score、pipes、bullets、pipeSpeed），呼叫 `reset()`，驗證所有欄位回到初始值且 highScore 不受影響

- [x] 9. Checkpoint — 確認所有測試通過
  - 執行 `npx vitest --run`，確認所有屬性測試與單元測試通過，如有問題請向使用者反映。

- [x] 10. 實作 Renderer
  - [x] 10.1 實作 `Renderer.init()` 與 `_drawBackground()`
    - `init(canvas)`：取得 2D context，載入 `assets/ghosty.png`（`Image` 物件），載入失敗時設 `ghostImageFailed = true`
    - `_drawBackground()`：以 `#87CEEB` 填滿 canvas
    - _Requirements: 2.6, 8.3_

  - [x] 10.2 實作 `Renderer._drawPipes()` 與 `_drawBullets()`
    - `_drawPipes(pipes, cameraX)`：計算畫面 X（`pipe.worldX - cameraX`），繪製上管（高度 = gapCenterY − gapHeight/2）與下管；`flashTimer > 0` 時填色 `#FF0000`，否則 `#4CAF50`；若有 brokenZone 則以圓形 clip 或裂痕圖案標示可穿越範圍
    - `_drawBullets(bullets, cameraX)`：以白色圓形繪製子彈（radius=4）
    - _Requirements: 2.6, 3.5, 3.7_

  - [x] 10.3 實作 `Renderer._drawGhost()` 與 `_drawHUD()`
    - `_drawGhost(ghost, cameraX)`：若 `ghost.blinkVisible === false` 則跳過；若圖片載入成功則 `drawImage`，否則以填色矩形 fallback
    - `_drawHUD(hp, score, highScore)`：左上角愛心 HP 圖示（❤/灰色）；頂部中央「Score: N　High: H」（字體 ≥ 18px）
    - _Requirements: 4.2, 4.3, 5.3_

  - [x] 10.4 實作 `Renderer._drawGameOver()` 與 `Renderer.render()`
    - `_drawGameOver(score)`：畫面中央半透明黑色遮罩，「Game Over」大字、當局分數、「按空白鍵或 Enter 重新開始」提示
    - `render(state)`：呼叫 `_drawBackground → _drawPipes → _drawBullets → _drawGhost → _drawHUD`；若 `state.mode === 'gameover'` 再呼叫 `_drawGameOver`
    - _Requirements: 6.2_

- [x] 11. 實作主迴圈並串接所有模組
  - [x] 11.1 實作 `GameEngine.update(timestamp)` 主迴圈
    - 計算 `dt`（ms，初始影格設 16.67）
    - 若 `state.mode === 'gameover'`：偵測 Space/Enter（consumePressed），呼叫 `reset()`；仍呼叫 `renderer.render(state)`；請求下一影格
    - 若 `state.mode === 'playing'`：依序呼叫 `_updateGhost`、`_updatePipes`、`_updateBullets`、`_checkCollisions`、`_updateScore`、`_updateSpeed`；呼叫 `renderer.render(state)`；請求下一影格
    - _Requirements: 8.4_

  - [x] 11.2 在 `index.html` / `game.js` 底部串接啟動邏輯
    - `DOMContentLoaded` 後：`KeyboardInput.init()`, `AudioManager.init()`, `Renderer.init(canvas)`, `GameEngine.init(canvas, AudioManager, Renderer)`
    - 呼叫 `requestAnimationFrame(ts => GameEngine.update(ts))` 啟動主迴圈
    - _Requirements: 8.1, 8.3, 8.4_

- [x] 12. Final Checkpoint — 確認所有測試通過並手動驗收
  - 執行 `npx vitest --run`，確認全部 13 個屬性測試與所有單元測試通過
  - 在瀏覽器中開啟 `index.html`，確認遊戲 3 秒內初始化、Canvas 正常渲染、鍵盤輸入有效、音效播放、Game Over 流程正常
  - 如有問題請向使用者反映。

---

## Notes

- 標記 `*` 的子任務為選用項，可跳過以加速 MVP 開發
- 每個任務皆引用具體需求條款以確保可追溯性
- 屬性測試對應設計文件中定義的 13 個 Correctness Properties
- 所有屬性測試標籤格式：`// Feature: kiro-ghost-shooter, Property N: <property_text>`
- 每個屬性測試至少執行 100 次隨機迭代（fast-check 預設）
- 音效、localStorage、圖片載入失敗均靜默處理，不中斷遊戲主迴圈
- 破損區域免傷邏輯（Property 7）需在碰撞偵測中優先判斷圓形碰撞

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3"] },
    { "id": 7, "tasks": ["5.4", "5.5", "6.1"] },
    { "id": 8, "tasks": ["6.2", "7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 10, "tasks": ["7.4", "8.2", "10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3"] },
    { "id": 12, "tasks": ["10.4", "11.1"] },
    { "id": 13, "tasks": ["11.2"] }
  ]
}
```
