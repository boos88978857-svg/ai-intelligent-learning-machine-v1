"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Whiteboard({ open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [畫筆大小, set畫筆大小] = useState(4);
  const [顏色, set顏色] = useState("#000000");
  const [使用橡皮, set使用橡皮] = useState(false);
  const [正在畫, set正在畫] = useState(false);

  // 初始化 canvas
  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = 顏色;
    ctx.lineWidth = 畫筆大小;

    ctxRef.current = ctx;
  }, [open]);

  // 更新画笔
  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = 使用橡皮 ? "#ffffff" : 顏色;
    ctxRef.current.lineWidth = 畫筆大小;
  }, [顏色, 畫筆大小, 使用橡皮]);

  if (!open) return null;

  function 取得座標(e: any) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    // 触控优先
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function startDraw(e: any) {
    e.preventDefault();
    if (!ctxRef.current) return;

    const { x, y } = 取得座標(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    set正在畫(true);
  }

  function moveDraw(e: any) {
    e.preventDefault();
    if (!正在畫) return;
    if (!ctxRef.current) return;

    const { x, y } = 取得座標(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  }

  function endDraw(e: any) {
    e.preventDefault();
    set正在畫(false);
  }

  function clearAll() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // 打开涂鸦墙时：锁住页面滚动
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end"
      }}
    >
      {/* 半屏浮层 */}
      <div
        style={{
          width: "100%",
          height: "50vh",
          background: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -10px 30px rgba(0,0,0,0.15)"
        }}
      >
        {/* 工具列 */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "10px 12px",
            borderBottom: "1px solid #eee",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <button onClick={() => set使用橡皮(false)}>✏️ 筆</button>
          <button onClick={() => set使用橡皮(true)}>🧽 橡皮</button>

          <input
            type="color"
            value={顏色}
            onChange={(e) => set顏色(e.target.value)}
          />

          <input
            type="range"
            min={2}
            max={16}
            value={畫筆大小}
            onChange={(e) => set畫筆大小(Number(e.target.value))}
          />

          <button onClick={clearAll}>清空</button>

          <div style={{ flex: 1 }} />

          <button onClick={onClose}>關閉 ✕</button>
        </div>

        {/* 画布 */}
        <div style={{ flex: 1 }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", touchAction: "none" }}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
          />
        </div>
      </div>
    </div>
  );
}