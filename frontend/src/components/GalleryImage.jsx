import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

// Admin-uploaded photo pool for a placeholder image slot (About Us bio/car
// photo, Sponsorships left/right image). Picks one photo at random from
// its category on mount, so the slot shows something different on every
// reload. Falls back to the existing gray-placeholder look (via
// `placeholder`/`children`) whenever the category has no photos yet, so the
// site never looks broken before anything's been uploaded.
export default function GalleryImage({ category, className, placeholder, children }) {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/content/gallery/?category=${encodeURIComponent(category)}`, { auth: false })
      .then((list) => {
        if (cancelled || !list.length) return;
        setPhoto(list[Math.floor(Math.random() * list.length)]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [category]);

  const style = photo
    ? {
        backgroundImage: `url(${photo.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className={className} style={style} aria-hidden={!children}>
      {!photo && placeholder}
      {children}
    </div>
  );
}
