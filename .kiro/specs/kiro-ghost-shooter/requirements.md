# Requirements Document

## Introduction

Kiro Ghost Shooter 是一款以 HTML5 Canvas + JavaScript 開發的純前端橫向捲軸射擊遊戲，靈感源自 Flappy Bird。玩家控制 Kiro 吉祥物小幽靈（ghosty），在不斷出現的上下水管障礙物之間飛行，並可發射子彈擊破水管開路。遊戲速度隨時間遞增，計分板記錄當局分數與歷史最高分。

---

## Glossary

- **幽靈（Ghost）**：玩家控制的角色，使用 `assets/ghosty.png` 圖示。
- **水管（Pipe）**：從畫面右側生成、向左移動的上下成對障礙物，中間有可通過的縫隙。
- **縫隙（Gap）**：上下水管之間供幽靈通過的空間，高度固定 150px，縫隙中心位置會隨時間上下移動。
- **破損區域（Broken Zone）**：水管被子彈擊中三次後產生的破損範圍（半徑 = 1.5 倍幽靈寬度），幽靈可安全穿越。
- **子彈（Bullet）**：玩家按空白鍵發射的投射物，同時朝八個方向射出，速度為 8 像素/影格。
- **血量（HP）**：幽靈的生命值，最多 3 格。
- **無敵時間（Invincibility）**：幽靈受傷後的保護期間，持續 500 毫秒，期間不受碰撞傷害。
- **計分板（Scoreboard）**：畫面頂部顯示當局分數（Score）與歷史最高分（High Score）的區域。
- **Game_Engine**：負責主迴圈、碰撞偵測、物件管理的核心模組。
- **Renderer**：負責將所有遊戲物件繪製到 Canvas 的模組。
- **Audio_Manager**：負責載入與播放音效檔案的模組。

---

## Requirements

### Requirement 1: 幽靈移動

**User Story:** 身為玩家，我想透過方向鍵上（↑）控制幽靈浮起，讓幽靈在自動向右飄移並持續受重力影響的情況下，仍能穿越水管縫隙。

#### Acceptance Criteria

1. WHILE 遊戲進行中，THE Game_Engine SHALL 在每個影格將幽靈的水平位置向右移動 3 像素（橫向捲軸效果，幽靈視覺位置固定於畫面左側約三分之一處，由攝影機捲動模擬前進）。
2. WHILE 遊戲進行中，THE Game_Engine SHALL 在每個影格對幽靈施加 0.4 像素/影格² 的向下重力加速度，使其垂直速度持續增加。
3. WHEN 玩家按下方向鍵上（↑），THE Game_Engine SHALL 立即將幽靈的垂直速度設為 −6 像素/影格（向上），使其垂直位置上升。
4. WHEN 幽靈垂直位置超出畫面下邊界，THE Game_Engine SHALL 觸發 Game Over 流程。
5. WHEN 幽靈垂直位置超出畫面上邊界，THE Game_Engine SHALL 將幽靈垂直速度歸零並將幽靈位置鎖定於上邊界（y = 0）。

---

### Requirement 2: 水管障礙物

**User Story:** 身為玩家，我想面對持續出現且間隙位置會上下移動的水管，讓遊戲具有足夠的挑戰性與變化性。

#### Acceptance Criteria

1. THE Game_Engine SHALL 每隔 1500 毫秒在畫面右側（x = 畫面寬度）生成一對上下水管，水管寬度為 60px，縫隙高度為 150px。
2. WHILE 遊戲進行中，THE Game_Engine SHALL 在每個影格將所有水管以當前速度向左移動。
3. WHILE 遊戲進行中，THE Game_Engine SHALL 使每對水管的縫隙中心位置以 1 像素/影格的速率在畫面垂直範圍內上下振盪，縫隙中心距畫面上下邊界各保持至少 80px 的安全距離。
4. WHEN 水管移出畫面左側邊界（x + 60 < 0），THE Game_Engine SHALL 將該水管物件從遊戲場景中移除。
5. THE Game_Engine SHALL 以初始速度 2 像素/影格開始，每經過 5 秒將水管移動速度增加 0.5 像素/影格，速度上限為 6 像素/影格。
6. THE Renderer SHALL 以綠色（#4CAF50）繪製水管，並使用淡藍色（#87CEEB）作為背景。

---

### Requirement 3: 子彈系統

**User Story:** 身為玩家，我想按空白鍵發射八方向子彈擊破水管，讓我能在遭遇障礙物時創造新的通道。

#### Acceptance Criteria

1. WHEN 玩家按下空白鍵，THE Game_Engine SHALL 從幽靈當前中心位置同時生成八顆子彈，分別朝上（270°）、下（90°）、左（180°）、右（0°）及四個對角線方向（45°、135°、225°、315°）飛行，每顆子彈速度為 8 像素/影格。
2. WHILE 子彈在畫面範圍內，THE Game_Engine SHALL 在每個影格依各自方向向量移動子彈。
3. WHEN 子彈飛出畫面邊界，THE Game_Engine SHALL 將該子彈從場景中移除。
4. WHEN 子彈與水管發生碰撞，THE Game_Engine SHALL 將該子彈從場景中移除，並將命中座標記錄至該水管，累計命中次數加一。
5. WHEN 水管累計命中次數為 1 或 2，THE Renderer SHALL 使該水管在 50 至 300 毫秒內以紅色（#FF0000）閃爍一次後恢復原色。
6. WHEN 水管累計命中次數達到 3，THE Game_Engine SHALL 在最後命中座標周圍建立一個半徑為 1.5 倍幽靈寬度的破損區域，幽靈可安全穿越該區域。
7. WHILE 水管存在破損區域，THE Renderer SHALL 以視覺上可辨識的方式（裂痕圖案或透明缺口）繪製破損區域，使玩家能辨識可穿越範圍。

---

### Requirement 4: 幽靈血量

**User Story:** 身為玩家，我想知道幽靈剩餘的血量，讓我能評估當前局勢並決定是否冒險穿越水管。

#### Acceptance Criteria

1. THE Game_Engine SHALL 在遊戲開始時將幽靈血量初始化為 3 格。
2. WHEN 幽靈與水管的非破損區域發生碰撞且目前不在無敵時間內，THE Game_Engine SHALL 將幽靈血量減少 1 格，並啟動 500 毫秒的無敵時間；WHILE 無敵時間進行中，THE Renderer SHALL 以幽靈閃爍（每 100 毫秒切換可見/隱藏）的方式提示玩家。
3. WHILE 遊戲進行中，THE Renderer SHALL 在畫面左上角以愛心圖示持續顯示幽靈當前血量（最多 3 顆，失去血量則愛心變灰）。
4. WHEN 幽靈血量歸零，THE Game_Engine SHALL 立即觸發 Game Over 流程。
5. WHEN 幽靈通過破損區域，THE Game_Engine SHALL 不扣除任何血量，亦不觸發無敵時間。

---

### Requirement 5: 計分系統

**User Story:** 身為玩家，我想看到即時分數與歷史最高分，讓我有目標持續挑戰自我。

#### Acceptance Criteria

1. THE Game_Engine SHALL 在遊戲開始時將當局分數初始化為 0。
2. WHEN 幽靈的後緣（trailing edge）超過一對水管的右緣（x 座標），且該水管尚未被計分，THE Game_Engine SHALL 將當局分數加 1（無論幽靈通過縫隙或破損區域均計分，每對水管只計一次）。
3. WHILE 遊戲進行中，THE Renderer SHALL 在畫面頂部中央持續顯示「Score: N」與「High: H」，字體不小於 18px。
4. WHEN 遊戲結束且當局分數高於歷史最高分，THE Game_Engine SHALL 以新分數更新歷史最高分，並以 key 為 `kiro_ghost_highscore` 儲存於瀏覽器的 Local Storage 中；IF Local Storage 寫入失敗，THE Game_Engine SHALL 靜默忽略錯誤。
5. WHEN 遊戲啟動，THE Game_Engine SHALL 從 Local Storage 讀取 key `kiro_ghost_highscore` 的值作為歷史最高分；IF 該 key 不存在或讀取失敗，THEN 歷史最高分預設為 0。

---

### Requirement 6: Game Over 與重新開始

**User Story:** 身為玩家，我想在遊戲結束時看到明確的提示並能快速重新開始，讓遊戲體驗流暢不中斷。

#### Acceptance Criteria

1. WHEN Game Over 流程被觸發，THE Audio_Manager SHALL 播放 `assets/game_over.wav` 音效。
2. WHEN Game Over 流程被觸發，THE Renderer SHALL 在畫面中央顯示「Game Over」訊息及當局分數，並在訊息下方提示「按空白鍵或 Enter 重新開始」。
3. WHEN 玩家在 Game Over 畫面按下空白鍵或 Enter，THE Game_Engine SHALL 重置所有遊戲狀態（幽靈位置、血量、分數、水管列表、子彈列表、遊戲速度）並重新開始遊戲。
4. WHEN 遊戲重新開始，THE Game_Engine SHALL 將水管移動速度重置為初始值 2 像素/影格。

---

### Requirement 7: 音效回饋

**User Story:** 身為玩家，我想在重要操作時聽到音效回饋，讓遊戲體驗更具臨場感。

#### Acceptance Criteria

1. WHEN 玩家按下方向鍵上（↑），THE Audio_Manager SHALL 播放 `assets/jump.wav` 音效；IF 音效正在播放中，THE Audio_Manager SHALL 重新從頭播放（reset and replay）以避免延遲。
2. IF `assets/jump.wav` 或 `assets/game_over.wav` 在載入或播放時發生任何錯誤，THEN THE Audio_Manager SHALL 捕獲該錯誤並靜默失敗（不拋出未捕獲例外、不中斷遊戲主迴圈）。

---

### Requirement 8: 技術平台與部署

**User Story:** 身為開發者，我想讓遊戲以純前端方式運作，讓玩家無需安裝任何環境即可在瀏覽器中遊玩。

#### Acceptance Criteria

1. THE Game_Engine SHALL 以 HTML5 Canvas API 與原生 JavaScript（ES2020+）實作，不依賴任何後端服務或第三方遊戲引擎。
2. THE Game_Engine SHALL 以不超過三個原始碼檔案組成（例如 `index.html`、`game.js`、`style.css`），或以單一 `index.html` 完成；資源檔案（圖片、音效）不計入此限制。
3. WHEN 使用者以 Chrome、Firefox、Safari 或 Edge 最新版本開啟遊戲入口檔案（`index.html`），THE Game_Engine SHALL 在 3 秒內完成初始化並顯示遊戲畫面。
4. WHILE 遊戲進行中，THE Game_Engine SHALL 使用 `requestAnimationFrame` 驅動主迴圈，並將目標渲染幀率維持在 30 至 60 FPS 之間（允許硬體效能差異）。
