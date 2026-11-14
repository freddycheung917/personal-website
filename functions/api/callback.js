// functions/api/callback.js — Decap CMS GitHub 登入：第 2 步
// 作用：GitHub 授權完會帶住一個臨時 code 返嚟呢度，呢個 Function
// 會用 client_secret（只喺伺服器端，唔會曝光）換取 access token，
// 再用 Decap CMS 認得嘅 handshake 方式，將結果傳返畀 /admin 頁面。
// 帳號資料只會由 context.env 讀取，絕對唔會寫死喺程式碼入面。

function getCookie(cookieHeader, name) {
  if (!cookieHeader) { return null; }
  var parts = cookieHeader.split(";");
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].trim().split("=");
    if (kv[0] === name) { return decodeURIComponent(kv[1] || ""); }
  }
  return null;
}

// 回傳一頁 HTML，做 Decap CMS 要求嘅 handshake：
// 1. 向 opener 送出 "authorizing:github"；
// 2. 等 opener 回覆同一個訊息，先至送出結果
//    "authorization:github:success:<token>" 或
//    "authorization:github:error:<原因>"。
// 訊息只會送去 window.location.origin，唔會送去其他來源。
function handshakePage(result) {
  var payload = JSON.stringify(result);
  var html = "<!doctype html><html><head><meta charset=\"utf-8\" />" +
    "<title>登入緊…</title></head><body><p>登入緊，請稍候…</p><script>" +
    "(function () {" +
    "var result = " + payload + ";" +
    "var opener = window.opener;" +
    "if (!opener) { document.body.innerHTML = '<p>登入視窗已經關閉，請重新喺後台登入。</p>'; return; }" +
    "function onMessage(e) {" +
    "if (e.origin !== window.location.origin) { return; }" +
    "if (e.source !== opener) { return; }" +
    "if (e.data !== 'authorizing:github') { return; }" +
    "window.removeEventListener('message', onMessage);" +
    "opener.postMessage(result, window.location.origin);" +
    "}" +
    "window.addEventListener('message', onMessage);" +
    "opener.postMessage('authorizing:github', window.location.origin);" +
    "})();" +
    "</script></body></html>";
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // 用完即棄：清走 state cookie。
      "Set-Cookie": "decap_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    }
  });
}

export async function onRequestGet(context) {
  var clientId = context.env.GITHUB_CLIENT_ID;
  var clientSecret = context.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response("GitHub OAuth 未設定：請喺 Cloudflare Pages 專案設定入面加入 GITHUB_CLIENT_ID 同 GITHUB_CLIENT_SECRET。", {status: 500});
  }

  var reqUrl = new URL(context.request.url);
  var code = reqUrl.searchParams.get("code");
  var state = reqUrl.searchParams.get("state");
  var savedState = getCookie(context.request.headers.get("Cookie"), "decap_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    return handshakePage("authorization:github:error:state_mismatch");
  }

  var redirectUri = reqUrl.origin + "/api/callback";
  var tokenRes;
  try {
    tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {"Accept": "application/json", "Content-Type": "application/json"},
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      })
    });
  } catch (e) {
    return handshakePage("authorization:github:error:token_request_failed");
  }

  var tokenData = await tokenRes.json().catch(function () { return {}; });
  var token = tokenData && tokenData.access_token;
  if (!tokenRes.ok || !token) {
    return handshakePage("authorization:github:error:token_exchange_failed");
  }

  return handshakePage("authorization:github:success:" + token);
}
