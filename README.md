# Freddy's Home — 個人網站

呢個係 Freddy 個人網站嘅完整專案：新世紀福音戰士式指揮中心風格嘅首頁（黑色主場、橙色主光、螢光黃訊號），加 Decap CMS 後台，日後可以直接喺網頁後台改內容，唔使掂程式碼。

## 資料夾結構

```
personal-website/
├── index.html                  首頁（內容由 content/*.json 載入）
├── assets/
│   ├── css/style.css           全站共用設計系統（顏色、字體、動畫都喺呢度）
│   ├── js/main.js              首頁行為（房間切換、時鐘、SYNC_RATE、留言簿…）
│   ├── eva-home.webp           首頁 Hero 圖片
│   └── uploads/                後台上載圖片嘅存放位置
├── content/
│   ├── notices.json            告示板內容（3 張字條）
│   ├── rooms.json              五個房間嘅內容
│   ├── site.json               首頁文字（歡迎詞、經文、跑馬燈…）
│   └── articles.json           書房文章列表（而家係空嘅，喺後台加文章就會出現喺書房）
├── admin/
│   ├── index.html              Decap CMS 後台頁面（網址係 /admin）
│   └── config.yml              Decap CMS 設定（邊個 repo、邊啲內容可以改）
├── functions/
│   └── api/
│       ├── auth.js             GitHub 登入第 1 步（帶去 GitHub 授權）
│       └── callback.js         GitHub 登入第 2 步（換取 token，傳返畀後台）
├── .gitignore
└── README.md                   呢個檔案
```

## 設定步驟

### (a) 喺 GitHub 開一個 repo，放呢個專案入去

1. 去 GitHub，開一個新 repository，名叫 `personal-website`（呢個只係預設名，開咗唔同名都得，但記得跟住步驟 (e) 改 `admin/config.yml` 入面嘅 `repo`）。
2. 將呢個資料夾入面嘅所有檔案 push 上去（`main` branch）。

### (b) Cloudflare Pages 接住個 repo

1. 去 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 揀啱個 repo（`freddycheung917/personal-website`）。
3. Build 設定：**唔使 build command**，**Output directory 填專案根目錄**（即係留空或者填 `.`，因為 `index.html` 就喺根目錄）。Framework preset 揀 None。
4. 撳 **Save and Deploy**。之後每次 push 去 GitHub，Cloudflare 都會自動重新發佈。

### (c) 喺 GitHub 開一個 OAuth App（畀後台登入用）

1. 去 GitHub → 頭像 → **Settings** → 左邊最底 **Developer settings** → **OAuth Apps** → **New OAuth App**。
2. 填：
   - **Application name**：例如 `Freddy Home CMS`
   - **Homepage URL**：`https://YOUR-DOMAIN.com`（換成你真正嘅 domain）
   - **Authorization callback URL**：`https://YOUR-DOMAIN.com/api/callback`（一定要係呢個路徑，換 domain 就得，後面 `/api/callback` 唔好改）
3. 撳 **Register application**，抄低 **Client ID**，再撳 **Generate a new client secret** 抄低 **Client Secret**。個 secret 只會顯示一次，唔好貼去任何公開地方。

### (d) 將 GitHub 帳號資料加到 Cloudflare Pages

去 Cloudflare Dashboard → 你個 Pages 專案 → **Settings** → **Environment variables**，加兩個 **encrypted secret**（Production 環境）：

- `GITHUB_CLIENT_ID` = 步驟 (c) 嘅 Client ID
- `GITHUB_CLIENT_SECRET` = 步驟 (c) 嘅 Client Secret

加完之後，要重新 deploy 一次先生效（**Deployments** → 最新嗰個 → **⋯** → **Retry deployment**，或者 push 一個小改動去 GitHub）。

### (e) 改 `admin/config.yml` 入面嘅預留位

- `repo` 已經預設咗 `freddycheung917/personal-website`。如果你喺步驟 (a) 開咗唔同名嘅 repo，改呢度做 `freddycheung917/你個repo名`。
- `base_url` 而家係 `https://YOUR-DOMAIN.com`，要換成你真正嘅 domain（例如 `https://freddycheung.com`），唔好留返個預留位，否則後台登入唔到。

改完 push 上 GitHub，等 Cloudflare 重新發佈。

### (f) 入後台改內容

去 `https://YOUR-DOMAIN.com/admin`，撳 **Login with GitHub**，用有權限寫入個 repo 嘅 GitHub 帳號登入。入到去會見到四類內容：**告示板**、**房間**、**書房文章**、**網站設定**。改完撳儲存，會開一個草稿（editorial workflow）；喺 **Workflow** 入面撳 **Publish** 先會正式出街。

### (g) 留言簿嘅限制

而家個留言簿仲係原型寫法：留言只會喺訪客自己今次瀏覽顯示，唔會儲存、唔會傳去任何地方。想真正收到訪客留言，之後要加 Cloudflare Workers + D1 資料庫先做到，嗰部分未做。

### (h) 改完內容要等一陣先見到

喺後台 publish 之後，Decap 會將改動寫入 GitHub，Cloudflare Pages 收到之後要重新發佈，通常 **1–2 分鐘**之後先會喺網站見到更新。如果等咗好耐都未見，可以去 Pages 專案嘅 **Deployments** 睇下最新嗰次發佈係咪成功咗。

## 書房文章點加

喺後台 **書房文章** 入面撳 **New**，填標題、日期、簡介同連結（冇連結可以留空）。加咗文章之後，首頁書房面板會自動出現「最新文章」一欄。`content/articles.json` 嘅結構係咁：

```json
{
  "articles": [
    {
      "title": "文章標題",
      "date": "2026-11-14",
      "summary": "一句簡介，講下篇文講咩。",
      "url": "https://example.com/article"
    }
  ]
}
```

## 風格點樣保持一致

全站只用一個樣式表（`assets/css/style.css`）：顏色、字體、間距全部用 `:root` 入面嘅 CSS 變數（例如 `--orange`、`--yellow`）定一次，每個頁面、每個組件都引用同一套。後台只會改內容檔案，唔會掂到樣式，所以點加內容都唔會走樣。想全站轉色，改 `style.css` 入面嘅變數就得。

## 本地預覽

喺呢個資料夾入面跑一個靜態伺服器就得（注意：直接雙擊 `index.html` 開唔到內容，因為瀏覽器唔畀 `file://` 讀 JSON 檔）：

```bash
python3 -m http.server 8000
```

然後去 http://localhost:8000 。（`/admin` 登入同 OAuth 功能喺本地預覽唔會運作，要 deploy 上 Cloudflare 先用到。）
