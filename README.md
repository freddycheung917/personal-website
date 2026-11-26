# Personal Hub — 個人工具與資源頁

簡潔、整齊嘅靜態個人資源與工具網站（支援深淺色模式切換），可直接部署於 Cloudflare Pages 或 GitHub Pages，無需 build step。

## 專案結構

```text
personal-website/
├── index.html                   主頁（分類篩選：查經資料、講道回顧、AI 資訊、小工具）
├── biblestudy/
│   ├── index.html               /biblestudy 查經總目錄頁（支援新舊約篩選與關鍵字搜尋）
│   └── 1-samuel-25.html         《撒母耳記上》25 章互動查經
├── mathgame/
│   └── index.html               /mathgame 數學小遊戲
├── data/
│   ├── biblestudy.json          查經目錄資料（主頁與 /biblestudy 共用）
│   ├── sermons.json             講道回顧 YouTube Playlist 設定
│   ├── ai.json                  AI 資訊與書籤清單
│   └── tools.json               小工具列表
└── assets/
    ├── css/style.css            全站統一樣式（淺色／深色主題）
    └── js/hub.js                主題切換、分類篩選與 JSON 資料載入
```

## 日常更新方式

- **新增查經資料**：將新 HTML 放進 `biblestudy/`（例如 `1-samuel-26.html`、`romans-8.html`），再喺 `data/biblestudy.json` 加一條紀錄，主頁同 `/biblestudy` 總目錄會自動更新。
- **接上講道 YouTube Playlist**：喺 `data/sermons.json` 填入 `playlistId`（YouTube 清單網址 `list=` 後面嗰串字）同 `url`，主頁會自動嵌入播放器。
- **更新 AI 資訊／小工具**：直接編輯 `data/ai.json` 或 `data/tools.json`。

## 本地預覽

```bash
python3 -m http.server 8000
```

然後打開 `http://localhost:8000` 及 `http://localhost:8000/biblestudy/`。
