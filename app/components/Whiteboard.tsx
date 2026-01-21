"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Point = { x: number; y: number };

export default function Whiteboard({ open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [isDown, setIsDown] = useState(false);
  const [last, setLast] = useState<Point | null>(null);

  const dpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  }, []);

  // 关闭时不要渲染（和 SessionClient 的 open 对齐）
  if (!open) return null;

  // 让画布跟容器尺寸一致
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827"; // 深色
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [dpr]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const drawLine = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const p = getPos(e);
    setIsDown(true);
    setLast(p);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDown || !last) return;
    const p = getPos(e);
    drawLine(last, p);
    setLast(p);
  };

  const onPointerUp = () => {
    setIsDown(false);
    setLast(null);
  };

  // 打开时锁住页面滚动（手机体验更好）
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  };

  const panel: React.CSSProperties = {
    width: "min(980px, 100%)",
    height: "min(620px, 78vh)",
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  };

  const topbar: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  };

  const title: React.CSSProperties = { fontWeight: 900 };

  const btnRow: React.CSSProperties = { display: "flex", gap: 8 };

  const btn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 700,
  };

  const btnPrimary: React.CSSProperties = {
    ...btn,
    border: "1px solid #111827",
  };

  const body: React.CSSProperties = {
    padding: 12,
    flex: 1,
  };

  const canvasWrap: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: 14,
    overflow: "hidden",
    touchAction: "none",
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={topbar}>
          <div style={title}>📝 涂鸦墙</div>
          <div style={btnRow}>
            <button style={btn} onClick={clear}>
              清空
            </button>
            <button style={btnPrimary} onClick={onClose}>
              关闭
            </button>
          </div>
        </div>

        <div style={body}>
          <div ref={wrapRef} style={canvasWrap}>
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}