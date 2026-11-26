/* ==========================================================================
   Personal Hub — Shared Script (Theme Toggle, Filters, Data Rendering)
   ========================================================================== */
(function () {
  "use strict";

  function escapeHTML(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function loadJSON(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  /* ---------------- Theme Toggle (Light / Dark) ---------------- */
  var THEME_KEY = "personal-hub-theme";
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeToggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeBtn) {
      var isDark = theme === "dark";
      themeBtn.setAttribute("aria-label", isDark ? "切換淺色模式" : "切換深色模式");
      themeBtn.setAttribute("title", isDark ? "切換淺色模式" : "切換深色模式");
      themeBtn.innerHTML = isDark
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) {}
  var initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initialTheme);

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---------------- Homepage (/) Logic ---------------- */
  var pageType = document.body.getAttribute("data-page");

  if (pageType === "home") {
    /* Category Filter */
    var filterWrap = document.getElementById("catFilters");
    if (filterWrap) {
      filterWrap.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-filter]");
        if (!btn) return;
        var cat = btn.getAttribute("data-filter");
        filterWrap.querySelectorAll("[data-filter]").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        document.querySelectorAll("[data-cat]").forEach(function (sec) {
          var show = cat === "all" || sec.getAttribute("data-cat") === cat;
          sec.classList.toggle("hidden", !show);
        });
      });
    }

    /* Render Bible Study Latest Preview */
    loadJSON("data/biblestudy.json").then(function (data) {
      var studies = data.studies || [];
      var box = document.getElementById("homeBibleStudy");
      var countEl = document.getElementById("bibleStudyCount");
      if (countEl) countEl.textContent = studies.length + " 篇已上架";
      if (!box || !studies.length) return;

      var latest = studies[0];
      box.innerHTML =
        '<div class="study-highlight">' +
          '<div>' +
            '<div class="study-meta">' +
              '<span class="badge badge-accent">最新整理</span>' +
              '<span>' + escapeHTML(latest.book) + ' · ' + escapeHTML(latest.bookEn || "") + ' · 第 ' + escapeHTML(latest.chapter) + ' 章</span>' +
            '</div>' +
            '<h3 class="item-title">' + escapeHTML(latest.title) + '</h3>' +
            '<p class="item-desc">' + escapeHTML(latest.subtitle || "") + '</p>' +
          '</div>' +
          '<a class="btn-primary" href="biblestudy/' + encodeURIComponent(latest.file) + '">開始閱讀 →</a>' +
        '</div>';
    }).catch(function () {});

    /* Render Sermons (YouTube Playlist Ready) */
    loadJSON("data/sermons.json").then(function (data) {
      var lists = data.playlists || [];
      var box = document.getElementById("homeSermons");
      var statusEl = document.getElementById("sermonStatus");
      if (!box || !lists.length) return;

      var first = lists[0];
      if (first.playlistId) {
        if (statusEl) statusEl.textContent = "YouTube 同步中";
        var embedUrl = "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(first.playlistId);
        var existingIframe = box.querySelector("iframe");
        if (existingIframe && existingIframe.getAttribute("src") === embedUrl) return;
        var watchUrl = first.url || ("https://www.youtube.com/playlist?list=" + encodeURIComponent(first.playlistId));
        box.innerHTML =
          '<div class="sermon-grid">' +
            '<div class="video-box">' +
              '<iframe src="' + embedUrl + '" title="' + escapeHTML(first.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>' +
            '</div>' +
            '<div class="playlist-note">' +
              '<h3 class="item-title">' + escapeHTML(first.title) + '</h3>' +
              '<p class="item-desc" style="margin:0">' + escapeHTML(first.description || "") + '</p>' +
              '<div style="margin-top:6px"><a class="btn-primary" href="' + escapeHTML(watchUrl) + '" target="_blank" rel="noopener noreferrer">喺 YouTube 打開完整清單 ↗</a></div>' +
            '</div>' +
          '</div>';
      }
    }).catch(function () {});

    /* Render AI Resources */
    loadJSON("data/ai.json").then(function (data) {
      var items = data.items || [];
      var grid = document.getElementById("homeAiGrid");
      if (!grid || !items.length) return;
      grid.innerHTML = items.map(function (item) {
        var tag = item.url
          ? '<a class="card card-hover ai-card" href="' + escapeHTML(item.url) + '" target="_blank" rel="noopener noreferrer">'
          : '<article class="card ai-card">';
        var endTag = item.url ? '</a>' : '</article>';
        var right = item.url
          ? '<span style="font-size:12px;color:var(--link)">↗</span>'
          : '<span class="badge">' + escapeHTML(item.status || "筆記") + '</span>';
        return tag +
          '<div>' +
            '<div class="ai-card-top"><span class="badge">' + escapeHTML(item.category || "AI") + '</span>' + right + '</div>' +
            '<h3 class="item-title">' + escapeHTML(item.title) + '</h3>' +
            '<p class="item-desc">' + escapeHTML(item.summary || "") + '</p>' +
          '</div>' +
        endTag;
      }).join("");
    }).catch(function () {});

    /* Render Tools */
    loadJSON("data/tools.json").then(function (data) {
      var tools = data.tools || [];
      var grid = document.getElementById("homeToolsGrid");
      if (!grid || !tools.length) return;
      var html = tools.map(function (t) {
        return '<a class="card card-hover tool-card" href="' + escapeHTML(t.path) + '">' +
          '<div>' +
            '<div class="study-meta" style="margin-bottom:4px">' +
              '<strong style="color:var(--ink);font-size:14px">' + escapeHTML(t.name) + '</strong>' +
              '<span class="badge mono">' + escapeHTML(t.badge || t.path) + '</span>' +
            '</div>' +
            '<p class="item-desc" style="margin:0">' + escapeHTML(t.description || "") + '</p>' +
          '</div>' +
          '<span class="study-row-link">開啟 →</span>' +
        '</a>';
      }).join("");
      html += '<div class="dashed-card">+ 預留工具位 — 日後新增靜態小工具可直接加落 <span class="mono">data/tools.json</span></div>';
      grid.innerHTML = html;
    }).catch(function () {});
  }

  /* ---------------- Bible Study Index (/biblestudy/) Logic ---------------- */
  if (pageType === "biblestudy") {
    var allStudies = [];
    var currentTestament = "all";
    var currentQuery = "";
    var container = document.getElementById("studyGroups");
    var totalEl = document.getElementById("studyTotal");
    var testamentWrap = document.getElementById("testamentFilters");
    var searchInput = document.getElementById("studySearch");

    function renderDirectory() {
      if (!container) return;
      var q = currentQuery.trim().toLowerCase();
      var filtered = allStudies.filter(function (s) {
        if (currentTestament !== "all" && s.testament !== currentTestament) return false;
        if (!q) return true;
        var hay = [s.book, s.bookEn, String(s.chapter), s.title, s.subtitle, (s.tags || []).join(" ")].join(" ").toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      if (totalEl) totalEl.textContent = filtered.length + " 篇查經資料";

      if (!filtered.length) {
        container.innerHTML = '<div class="card empty-state">暫時搵唔到符合條件嘅查經資料。</div>';
        return;
      }

      /* Group by Book */
      var groups = [];
      var groupMap = {};
      filtered.forEach(function (s) {
        var key = s.book + "|" + (s.bookEn || "");
        if (!groupMap[key]) {
          groupMap[key] = { book: s.book, bookEn: s.bookEn || "", testament: s.testament, items: [] };
          groups.push(groupMap[key]);
        }
        groupMap[key].items.push(s);
      });

      container.innerHTML = groups.map(function (g) {
        var testamentLabel = g.testament === "new" ? "新約" : "舊約";
        var rows = g.items.map(function (s) {
          var tags = (s.tags || []).map(function (t) {
            return '<span class="badge">' + escapeHTML(t) + '</span>';
          }).join("");
          return '<a class="study-row" href="' + encodeURIComponent(s.file) + '">' +
            '<div>' +
              '<div class="study-meta">' +
                '<span class="badge badge-accent">第 ' + escapeHTML(s.chapter) + ' 章</span>' +
                (s.version ? '<span class="badge">' + escapeHTML(s.version) + '</span>' : '') +
                '<span class="mono">' + escapeHTML(s.file) + '</span>' +
              '</div>' +
              '<h3 class="item-title">' + escapeHTML(s.title) + '</h3>' +
              (s.subtitle ? '<p class="item-desc">' + escapeHTML(s.subtitle) + '</p>' : '') +
              (tags ? '<div class="tag-list">' + tags + '</div>' : '') +
            '</div>' +
            '<span class="study-row-link">打開閱讀 →</span>' +
          '</a>';
        }).join("");

        return '<section class="book-group">' +
          '<div class="book-head">' +
            '<div class="book-head-left">' +
              '<h2 class="book-name">' + escapeHTML(g.book) + '</h2>' +
              '<span class="book-en">' + escapeHTML(g.bookEn) + ' · ' + testamentLabel + '</span>' +
            '</div>' +
            '<span class="book-en mono">' + g.items.length + ' 篇</span>' +
          '</div>' +
          '<div class="card study-list">' + rows + '</div>' +
        '</section>';
      }).join("");
    }

    if (testamentWrap) {
      testamentWrap.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-testament]");
        if (!btn) return;
        currentTestament = btn.getAttribute("data-testament");
        testamentWrap.querySelectorAll("[data-testament]").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        renderDirectory();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        currentQuery = searchInput.value;
        renderDirectory();
      });
    }

    loadJSON("../data/biblestudy.json").then(function (data) {
      allStudies = data.studies || [];
      renderDirectory();
    }).catch(function () {
      /* Static HTML fallback remains visible when opened directly via file:// */
    });
  }
})();
