// functions/api/auth.js — Decap CMS GitHub 登入：第 1 步
// 作用：將編輯者帶去 GitHub 做授權。GitHub 嘅 client_secret 交換
// 一定要喺伺服器端做，唔可以喺瀏覽器做，所以要用呢個 Function。
// 帳號資料只會由 context.env 讀取，絕對唔會寫死喺程式碼入面。

function randomState() {
  var bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
}

export async function onRequestGet(context) {
  var clientId = context.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("GitHub OAuth 未設定：請喺 Cloudflare Pages 專案設定入面加入 GITHUB_CLIENT_ID。", {status: 500});
  }

  var reqUrl = new URL(context.request.url);
  var redirectUri = reqUrl.origin + "/api/callback";
  var state = randomState();

  var authorizeUrl = "https://github.com/login/oauth/authorize" +
    "?client_id=" + encodeURIComponent(clientId) +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=" + encodeURIComponent("repo user") +
    "&state=" + encodeURIComponent(state);

  return new Response(null, {
    status: 302,
    headers: {
      "Location": authorizeUrl,
      // state 存喺 HttpOnly cookie，callback 嗰陣用嚟核對，防止 CSRF。
      "Set-Cookie": "decap_oauth_state=" + state + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600"
    }
  });
}
