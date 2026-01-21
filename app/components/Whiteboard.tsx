// app/components/Whiteboard.tsx
"use client";

import React, { useEffect, useRef } from "react";

export default function Whiteboard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      // 全屏画布
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
    };
    resize();
    window.addEventListener("resize", resize);

    const getXY = (e: PointerEvent) => {
      return { x: e.clientX, y: e.clientY };
    };

    const onDown = (e: PointerEvent) => {
      drawingRef.current = true;
      const { x, y } = getXY(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const { x, y } = getXY(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const onUp = () => {
      drawingRef.current = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 9999,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
          background: "rgba(255,255,255,0.85)",
        }}
      />
      <div style={{ position: "fixed", top: 12, right: 12, display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            const c = canvasRef.current;
            if (!c) return;
            const ctx = c.getContext("2d");
            if (!ctx) return;
            ctx.clearRect(0, 0, c.width, c.height);
          }}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          清空
        </button>
        <button
          onClick={onClose}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}