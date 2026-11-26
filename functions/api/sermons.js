const PLAYLIST_ID = "PLQ-Xx8rSSLVhnyXG8uso_r6Qw-PlEvJlb";
const MAX_VIDEOS = 3;

function decodeXml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseTag(block, tag) {
  const re = new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i");
  const m = block.match(re);
  return m ? decodeXml(m[1].trim()) : "";
}

export async function onRequestGet() {
  const feedUrl =
    "https://www.youtube.com/feeds/videos.xml?playlist_id=" +
    encodeURIComponent(PLAYLIST_ID);

  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "PersonalHub/1.0" },
      cf: { cacheTtl: 900, cacheEverything: true }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Upstream error" }), {
        status: 502,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    const xml = await res.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];

    const videos = entries.slice(0, MAX_VIDEOS).map((entry) => {
      const videoId = parseTag(entry, "yt:videoId");
      const title = parseTag(entry, "title");
      const published = parseTag(entry, "published");
      const dateMatch = title.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      const date = dateMatch ? dateMatch[1] : published.slice(0, 10);

      return {
        videoId,
        title,
        date,
        thumbnail: videoId
          ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg"
          : "",
        url: videoId
          ? "https://www.youtube.com/watch?v=" +
            videoId +
            "&list=" +
            PLAYLIST_ID
          : ""
      };
    }).filter((v) => v.videoId);

    return new Response(
      JSON.stringify({
        playlistId: PLAYLIST_ID,
        playlistUrl: "https://www.youtube.com/playlist?list=" + PLAYLIST_ID,
        videos
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=900"
        }
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch feed" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
