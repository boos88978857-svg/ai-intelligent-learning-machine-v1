"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Tool = "pen" | "eraser";

export default function Whiteboard(props: {
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  const { open, onClose, title = "涂鴉牆" } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [penSize, setPenSize] = useState(6);
  const [eraserSize, setEraserSize] = useState(18);
  const [color, setColor] = useState("#111111");

  // 手機：工具列預設收起，點筆/橡皮擦再展開
  const [toolsOpen, setToolsOpen] = useState(false);

  // 內部狀態：是否正在畫
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const palette = useMemo(
    () => ["#111111", "#2563eb", "#dc2626", "#16a34a", "#7c3aed", "#f59e0b", "#0ea5e9", "#ffffff"],
    []
  );

  // 開啟時鎖住 body 滾動（避免畫的時候畫面跟著滑動）
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 依容器大小重設 canvas（保持畫布清晰）
  function resizeCanvas() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    // 保留舊圖
    const old = document.createElement("canvas");
    old.width = canvas.width;
    old.height = canvas.height;
    const oldCtx = old.getContext("2d");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (oldCtx) oldCtx.drawImage(canvas, 0, 0);

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${Math.floor(rect.width)}px`;
    canvas.style.height = `${Math.floor(rect.height)}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 還原舊圖（依 dpr 轉回）
    if (old.width && old.height) {
      ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr);
    }
  }

  useEffect(() => {
    if (!open) return;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [open]);

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function clearAll() {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function begin(x: number, y: number) {
    drawingRef.current = true;
    lastRef.current = { x, y };
  }

  function drawTo(x: number, y: number) {
    const ctx = getCtx();
    if (!ctx) return;

    const last = lastRef.current;
    if (!drawingRef.current || !last) {
      lastRef.current = { x, y };
      return;
    }

    const size = tool === "pen" ? penSize : eraserSize;

    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = tool === "pen" ? color : "rgba(0,0,0,1)";
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastRef.current = { x, y };
  }

  function end() {
    drawingRef.current = false;
    lastRef.current = null;
  }

  // 指標事件：同時支援滑鼠與觸控，並阻止滑動
  function onPointerDown(e: React.PointerEvent) {
    if (!open) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    begin(x, y);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!open) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawTo(x, y);
  }

  function onPointerUp() {
    end();
  }

  if (!open) return null;

  // 半屏：直向 -> 底部半屏；橫向/寬螢幕 -> 右側半屏
  const isLandscape = typeof window !== "undefined" ? window.innerWidth > window.innerHeight : true;
  const panelStyle: React.CSSProperties = isLandscape
    ? { position: "fixed", top: 0, right: 0, width: "50vw", height: "100vh" }
    : { position: "fixed", left: 0, bottom: 0, width: "100vw", height: "50vh" };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: "rgba(0,0,0,0.25)"
  };

  const panelBase: React.CSSProperties = {
    ...panelStyle,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderLeft: isLandscape ? "1px solid #e5e5e5" : undefined,
    borderTop: !isLandscape ? "1px solid #e5e5e5" : undefined,
    display: "grid",
    gridTemplateRows: "auto 1fr",
    overflow: "hidden"
  };

  const header: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 10px",
    borderBottom: "1px solid #eee"
  };

  const hTitle: React.CSSProperties = { fontWeight: 900 };

  const hBtns: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };

  const hBtn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid #e5e5e5",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer"
  };

  const body: React.CSSProperties = {
    position: "relative",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gap: 8,
    padding: 10
  };

  const toolsBar: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  };

  const toolBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 10px",
    borderRadius: 12,
    border: active ? "1px solid #111" : "1px solid #e5e5e5",
    background: active ? "#f5f5f5" : "#fff",
    fontWeight: 900,
    cursor: "pointer"
  });

  const slider: React.CSSProperties = {
    width: 110
  };

  return (
    <>
      {/* 半透明遮罩，点外面关闭 */}
      <div style={overlayStyle} onClick={onClose} />

      <div style={panelBase}>
        {/* 顶部栏 */}
        <div style={header}>
          <div style={hTitle}>{title}</div>
          <div style={hBtns}>
            <button style={hBtn} onClick={clearAll}>清除</button>
            <button style={hBtn} onClick={onClose}>关闭</button>
          </div>
        </div>

        {/* 主体 */}
        <div style={body}>
          {/* 工具列 */}
          <div style={toolsBar}>
            <button
              style={toolBtn(tool === "pen")}
              onClick={() => {
                setTool("pen");
                setToolsOpen(true);
              }}
            >
              ✏️ 笔
            </button>

            <button
              style={toolBtn(tool === "eraser")}
              onClick={() => {
                setTool("eraser");
                setToolsOpen(true);
              }}
            >
              🧽 橡皮擦
            </button>

            {/* 手机：点工具才展开 */}
            {toolsOpen && (
              <>
                {tool === "pen" ? (
                  <>
                    <input
                      type="range"
                      min={2}
                      max={20}
                      value={penSize}
                      onChange={(e) => setPenSize(Number(e.target.value))}
                      style={slider}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      {palette.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: c === color ? "2px solid #111" : "1px solid #e5e5e5",
                            background: c,
                            cursor: "pointer"
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <input
                    type="range"
                    min={8}
                    max={40}
                    value={eraserSize}
                    onChange={(e) => setEraserSize(Number(e.target.value))}
                    style={slider}
                  />
                )}

                <button
                  style={hBtn}
                  onClick={() => setToolsOpen(false)}
                >
                  收合
                </button>
              </>
            )}
          </div>

          {/* 画布区 */}
          <div
            ref={wrapRef}
            style={{
              position: "relative",
              flex: 1,
              borderRadius: 14,
              border: "1px solid #e6e6e6",
              background: "#fff",
              touchAction: "none" // 关键：防止画的时候页面滑动
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}