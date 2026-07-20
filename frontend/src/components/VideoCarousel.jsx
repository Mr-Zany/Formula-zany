import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import { youTubeEmbedUrl, youTubeThumbnailUrl } from "../youtube";
import "./VideoCarousel.css";

const ROTATE_MS = 5000;
const PLATFORM_ICON = { youtube: "▶️", tiktok: "♪", instagram: "\u{1F4F7}", facebook: "f" };

// Section 4d: auto-rotates through short-form updates, labeled "Short" or
// "Video" as it cycles. Clicking the current thumbnail stops rotation and
// plays it. Only YouTube gets a real embed right now -- Facebook/Instagram
// need a Meta Developer app that doesn't exist yet, so those just show the
// platform icon, creator picture, and title without playing inline.
export default function VideoCarousel() {
  const [videos, setVideos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    apiFetch("/content/videos/", { auth: false })
      .then(setVideos)
      .catch(() => setVideos([]));
  }, []);

  useEffect(() => {
    if (!videos || videos.length < 2 || playing) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % videos.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [videos, playing]);

  const active = videos?.[activeIndex];
  const embedUrl = useMemo(
    () => (active?.platform === "youtube" ? youTubeEmbedUrl(active.url) : null),
    [active]
  );

  if (videos === null) return null;
  if (videos.length === 0) {
    return <div className="video-carousel video-carousel--empty">No videos posted yet -- check back soon.</div>;
  }

  return (
    <div className="video-carousel">
      <div className="video-carousel__stage">
        {playing && embedUrl ? (
          <iframe
            className="video-carousel__iframe"
            src={embedUrl}
            title={active.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="video-carousel__thumb-button"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${active.title}`}
          >
            {active.platform === "youtube" && youTubeThumbnailUrl(active.url) ? (
              <img src={youTubeThumbnailUrl(active.url)} alt="" />
            ) : (
              <div className="video-carousel__fallback-thumb">
                <span aria-hidden="true">{PLATFORM_ICON[active.platform] || "▶"}</span>
              </div>
            )}
            <span className="video-carousel__play-badge">▶</span>
          </button>
        )}

        <div className="video-carousel__meta">
          {active.creator_picture_url ? (
            <img className="video-carousel__creator-pic" src={active.creator_picture_url} alt="" />
          ) : (
            <span className="video-carousel__creator-pic video-carousel__creator-pic--fallback">
              {active.creator_name?.[0]?.toUpperCase()}
            </span>
          )}
          <div>
            <div className="video-carousel__title">{active.title}</div>
            <div className="video-carousel__subtitle">
              {active.creator_name} · <span className="video-carousel__type">{active.content_type}</span> ·{" "}
              {active.platform}
            </div>
          </div>
        </div>
      </div>

      <div className="video-carousel__dots">
        {videos.map((v, i) => (
          <button
            key={v.id}
            type="button"
            className={`video-carousel__dot ${i === activeIndex ? "is-active" : ""}`}
            aria-label={`Show ${v.title}`}
            onClick={() => {
              setActiveIndex(i);
              setPlaying(false);
            }}
          />
        ))}
      </div>
    </div>
  );
}
