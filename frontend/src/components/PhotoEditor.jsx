import { useRef, useState } from "react";
import "./PhotoEditor.css";

// Section 7b, demo quality per the PRD's own allowance: no drag
// boundary-clamping, and nothing is sent to the backend (profile_picture_url
// stays a plain URL string) -- Submit just renders the crop to a data URL
// and hands it back for the caller to use as a local preview.
const CIRCLE_SIZE = 220;
const MAX_ZOOM = 3;

export default function PhotoEditor({ onCancel, onSubmit }) {
  const fileInputRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  function pickPhoto() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageSrc(URL.createObjectURL(file));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function handleImageLoad(event) {
    setNaturalSize({
      width: event.target.naturalWidth,
      height: event.target.naturalHeight,
    });
  }

  // "Scales to whichever dimension is smaller, so it always fully covers
  // the circle" (7b) -- standard cover-fit: the smaller dimension is
  // scaled up to the circle's diameter, the larger one overflows.
  const baseScale = naturalSize
    ? CIRCLE_SIZE / Math.min(naturalSize.width, naturalSize.height)
    : 1;
  const scale = baseScale * zoom;
  const displayWidth = naturalSize ? naturalSize.width * scale : 0;
  const displayHeight = naturalSize ? naturalSize.height * scale : 0;

  function handlePointerDown(event) {
    dragState.current = { startX: event.clientX, startY: event.clientY, startOffset: offset };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setOffset({
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy,
    });
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleSubmit() {
    const canvas = document.createElement("canvas");
    canvas.width = CIRCLE_SIZE;
    canvas.height = CIRCLE_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.beginPath();
    ctx.arc(CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const img = new window.Image();
    img.onload = () => {
      const drawX = CIRCLE_SIZE / 2 + offset.x - displayWidth / 2;
      const drawY = CIRCLE_SIZE / 2 + offset.y - displayHeight / 2;
      ctx.drawImage(img, drawX, drawY, displayWidth, displayHeight);
      ctx.restore();
      onSubmit(canvas.toDataURL("image/png"));
    };
    img.src = imageSrc;
  }

  return (
    <div className="photo-editor">
      <div className="photo-editor__header">
        <h3>Update profile picture</h3>
        <button type="button" className="photo-editor__close" onClick={onCancel} aria-label="Close">
          ×
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      {!imageSrc ? (
        <div className="photo-editor__picker">
          <button type="button" className="btn-secondary" onClick={pickPhoto}>
            Choose photo
          </button>
        </div>
      ) : (
        <>
          <div
            className="photo-editor__crop"
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              style={{
                width: displayWidth,
                height: displayHeight,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          </div>

          <div className="photo-editor__zoom">
            <label htmlFor="zoom-slider">Zoom</label>
            <input
              id="zoom-slider"
              type="range"
              min="1"
              max={MAX_ZOOM}
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </div>

          <p className="photo-editor__limit-note">
            Profile picture changes are limited to once every two weeks.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={pickPhoto}>
              Choose a different photo
            </button>
            <button type="button" className="btn-primary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
