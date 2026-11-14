/* ==========================================================================
   FREDDY_HOME — 全站行為（main.js）
   內容由 content/*.json 載入（Decap CMS 喺 /admin 編輯嗰啲檔案），
   載入失敗時會顯示後備訊息，唔會靜靜雞留白。
   BOOST、時鐘、SYNC_RATE、reveal、留言簿嘅行為同原型完全一樣。
   ========================================================================== */
(function () {
"use strict";

function $(id) { return document.getElementById(id); }
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c];
  });
}
function loadJSON(path) {
  return fetch(path).then(function (r) {
    if (!r.ok) { throw new Error("HTTP " + r.status + " 載入 " + path); }
    return r.json();
  });
}

/* ---------------- Reveal-on-scroll（尊重 prefers-reduced-motion） ---------------- */
var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var io = null;
if (!reduceMotion && "IntersectionObserver" in window) {
  io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, {threshold: 0.12});
}
function observeReveal(els) {
  if (!io) { return; }
  els.forEach(function (el) { el.classList.add("rv"); io.observe(el); });
}
observeReveal(document.querySelectorAll(".sec-head,.board,.room-panel,.verse-band,.step,.guest-form"));

/* ---------------- 網站字串（content/site.json） ---------------- */
/* HTML 入面已經有同一份靜態文字做後備，JSON 載入失敗時內容照常顯示。 */
function applySite(site) {
  if (!site) { return; }
  var map = {
    heroEn: "hero_en", heroTitle: "hero_title",
    lede1: "lede_1", lede2: "lede_2",
    hostName: "host_name", hostDesc: "host_desc",
    verseLabel: "verse_label", verseText: "verse_text",
    verseCite: "verse_cite", verseNote: "verse_note",
    footerNote: "footer_note"
  };
  Object.keys(map).forEach(function (id) {
    var el = $(id), v = site[map[id]];
    if (el && typeof v === "string") { el.innerHTML = v; }
  });
  var ticker = $("tickerTrack");
  if (ticker && typeof site.ticker === "string") {
    ticker.innerHTML = "<span>&nbsp;" + site.ticker + "</span><span>&nbsp;" + site.ticker + "</span>";
  }
}
loadJSON("content/site.json").then(applySite).catch(function () {
  /* 後備內容已在 HTML 入面，唔使另外處理。 */
});

/* ---------------- 告示板（content/notices.json） ---------------- */
var WHERE_COLORS = {"var(--orange2)": 1, "var(--yellow)": 1};
var CHIP_STYLES = {"new": 1, "live": 1, "soon": 1};
function renderNotices(list) {
  var wrap = $("notesWrap"), count = $("boardCount");
  if (count) { count.textContent = list.length + " ACTIVE"; }
  if (!list.length) {
    wrap.innerHTML = "<p class='load-note'>// 告示板暫時未有新訊號。</p>";
    return;
  }
  wrap.innerHTML = list.map(function (n, i) {
    var idx = String(i + 1).padStart(2, "0");
    var color = WHERE_COLORS[n.where_color] ? n.where_color : "var(--orange2)";
    var chip = CHIP_STYLES[n.chip_style] ? n.chip_style : "new";
    return "<article class='note'><span class='idx'>" + idx + "</span>" +
      "<span class='where' style='color:" + color + "'>" + escapeHTML(n.where || "") + "</span>" +
      "<h3>" + escapeHTML(n.title || "") + "</h3>" +
      "<p>" + escapeHTML(n.body || "") + "</p>" +
      "<span class='chip " + chip + "'>" + escapeHTML(n.chip || "") + "</span></article>";
  }).join("");
  observeReveal(wrap.querySelectorAll(".note"));
}
loadJSON("content/notices.json").then(function (d) {
  renderNotices(d.notices || []);
}).catch(function () {
  var count = $("boardCount");
  if (count) { count.textContent = "OFFLINE"; }
  $("notesWrap").innerHTML = "<p class='load-error'><b>// SIGNAL LOST</b> — 告示板內容載入失敗，請檢查網路連線後重新整理頁面。</p>";
});

/* ---------------- 房間（content/rooms.json + content/articles.json） ---------------- */
var ROOMS = null, ARTICLES = [], currentRoom = "living";
var panel = $("roomPanel");
var doors = Array.prototype.slice.call(document.querySelectorAll(".door"));

function listHTML(items) {
  return "<ul>" + items.map(function (t) { return "<li>" + escapeHTML(t) + "</li>"; }).join("") + "</ul>";
}
function articlesHTML() {
  if (!ARTICLES.length) { return ""; }
  var items = ARTICLES.map(function (a) {
    var title = escapeHTML(a.title || "");
    var head = a.url ? "<a href='" + escapeHTML(a.url) + "'>" + title + "</a>" : title;
    return "<li>" + head +
      (a.date ? "<span class='article-date'>" + escapeHTML(a.date) + "</span>" : "") +
      (a.summary ? "<p>" + escapeHTML(a.summary) + "</p>" : "") + "</li>";
  }).join("");
  return "<div class='article-block'><h4>最新文章</h4><ul class='article-list'>" + items + "</ul></div>";
}
function showRoom(key) {
  if (!ROOMS || !ROOMS[key]) { return; }
  var r = ROOMS[key];
  currentRoom = key;
  panel.style.setProperty("--room", r.color);
  panel.style.setProperty("--room-soft", r.soft);
  panel.innerHTML = "<div class='panel-bar'><span class='dot o'></span><span class='dot g'></span><span class='dot d'></span><span>" + escapeHTML(r.path) + "</span><span>" + escapeHTML(r.en) + " // LOADED</span></div>" +
    "<div class='panel-body'><h3>" + escapeHTML(r.name) + "<small>" + escapeHTML(r.en) + "</small></h3>" +
    "<p class='panel-sub'>" + escapeHTML(r.sub) + "</p>" +
    "<p class='panel-desc'>" + escapeHTML(r.desc) + "</p>" +
    "<div class='panel-cols'><div><h4>房入面有咩</h4>" + listHTML(r.inside) + "</div>" +
    "<div><h4>日後會加</h4>" + listHTML(r.coming) + "</div></div>" +
    (key === "study" ? articlesHTML() : "") + "</div>";
  panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
  doors.forEach(function (d) {
    var sel = d.getAttribute("data-room") === key;
    d.setAttribute("aria-selected", sel ? "true" : "false");
    var s = d.querySelector(".status");
    if (s) { s.textContent = sel ? "● SELECTED" : "○ STANDBY"; }
  });
}
doors.forEach(function (d) {
  d.addEventListener("click", function () { showRoom(d.getAttribute("data-room")); });
});
Promise.all([
  loadJSON("content/rooms.json"),
  loadJSON("content/articles.json").catch(function () { return {articles: []}; })
]).then(function (results) {
  ROOMS = {};
  (results[0].rooms || []).forEach(function (r) { ROOMS[r.key] = r; });
  ARTICLES = results[1].articles || [];
  showRoom("living");
}).catch(function () {
  panel.innerHTML = "<div class='panel-body'><p class='load-error'><b>// MODULE DATA OFFLINE</b> — 房間資料載入失敗，請檢查網路連線後重新整理頁面。</p></div>";
});

/* ---------------- BOOST MODE ---------------- */
var lampBtn = $("lampBtn"), lampLabel = $("lampLabel");
lampBtn.addEventListener("click", function () {
  var on = document.body.classList.toggle("boost");
  lampBtn.setAttribute("aria-pressed", on ? "true" : "false");
  lampLabel.textContent = on ? "BOOST 啟動中" : "啟動 BOOST MODE";
});

/* ---------------- 時鐘（連秒數） ---------------- */
var clockEl = $("homeClock");
function tick() {
  var d = new Date();
  clockEl.textContent = String(d.getHours()).padStart(2, "0") + ":" +
    String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
}
tick(); setInterval(tick, 1000);

/* ---------------- SYNC_RATE 儀表 ---------------- */
var syncFill = $("syncFill"), syncVal = $("syncVal"), syncT = 0;
function syncTick() {
  syncT += 1;
  var boost = document.body.classList.contains("boost");
  var base = boost ? 91.4 : 41.27, amp = boost ? 3.4 : 0.85;
  var v = base + Math.sin(syncT * 0.7) * amp + Math.sin(syncT * 2.3) * amp * 0.3;
  syncVal.textContent = v.toFixed(2) + "%";
  syncFill.style.width = Math.min(100, Math.max(0, v)) + "%";
}
syncTick(); setInterval(syncTick, 900);

/* ---------------- 留言簿（原型：只喺今次瀏覽顯示，唔會儲存） ---------------- */
var guestList = $("guestList");
var entries = [
  {name: "訪客", msg: "第一次嚟，客廳幅畫好靚，坐低唔捨得走。", demo: true},
  {name: "主日學同學", msg: "等緊《財務自由》嗰課，書房開好門記得通知聲。", demo: true}
];
function todayLabel() {
  var d = new Date();
  return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日";
}
function renderGuests() {
  if (!entries.length) {
    guestList.innerHTML = "<div class='guest-empty'>// 仲未有人留名 — 你可以做第一個。</div>";
    return;
  }
  guestList.innerHTML = entries.map(function (e) {
    return "<article class='guest-note'><div class='g-head'><strong>" + e.name + "</strong>" +
      (e.demo ? "<span class='demo-tag'>示範留言</span>" : "") +
      "<time>" + (e.date || todayLabel()) + "</time></div><p>" + e.msg + "</p></article>";
  }).join("");
}
renderGuests();
$("guestForm").addEventListener("submit", function (ev) {
  ev.preventDefault();
  var name = $("guestName").value.trim() || "無名訪客";
  var msg = $("guestMsg").value.trim();
  if (!msg) { return; }
  entries.unshift({name: escapeHTML(name), msg: escapeHTML(msg), date: todayLabel()});
  renderGuests();
  ev.target.reset();
  guestList.firstElementChild.scrollIntoView({behavior: "smooth", block: "center"});
});

})();
