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