"use client";

import { useEffect, useRef, useState } from "react";

// Tekenvak voor een handtekening: werkt met muis, vinger en stylus.
// Geeft een PNG (data-URL, transparante achtergrond) terug, of null als het vak leeg is.
export default function SignaturePad({
  onChange,
  label = "Teken hier je handtekening",
}: {
  onChange: (png: string | null) => void;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tekent = useRef(false);
  const vorige = useRef<{ x: number; y: number } | null>(null);
  const [leeg, setLeeg] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const schaal = () => {
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#3d1419";
      ctx.lineWidth = 2.2;
    };
    schaal();
    // Bij draaien van een telefoon het vak opnieuw maken (dat wist wat er stond)
    const opnieuw = () => {
      schaal();
      setLeeg(true);
      onChange(null);
    };
    window.addEventListener("orientationchange", opnieuw);
    return () => window.removeEventListener("orientationchange", opnieuw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const punt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    tekent.current = true;
    vorige.current = punt(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(vorige.current.x, vorige.current.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = "#3d1419";
    ctx.fill();
  }
  function beweeg(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!tekent.current || !vorige.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = punt(e);
    const midden = { x: (vorige.current.x + p.x) / 2, y: (vorige.current.y + p.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(vorige.current.x, vorige.current.y);
    ctx.quadraticCurveTo(vorige.current.x, vorige.current.y, midden.x, midden.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    vorige.current = p;
  }
  function stop() {
    if (!tekent.current) return;
    tekent.current = false;
    vorige.current = null;
    setLeeg(false);
    onChange(canvasRef.current!.toDataURL("image/png"));
  }
  function wissen() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setLeeg(true);
    onChange(null);
  }

  return (
    <div>
      <div className="relative rounded-md border border-line overflow-hidden" style={{ background: "#ffffff" }}>
        <canvas
          ref={canvasRef}
          aria-label={label}
          role="img"
          className="block w-full h-44 cursor-crosshair"
          style={{ touchAction: "none" }}
          onPointerDown={start}
          onPointerMove={beweeg}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={stop}
        />
        <div className="pointer-events-none absolute left-5 right-5 bottom-10 border-b" style={{ borderColor: "rgba(61,20,25,.25)" }} />
        {leeg && (
          <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs" style={{ color: "rgba(61,20,25,.5)" }}>
            {label}
          </span>
        )}
      </div>
      <div className="flex justify-end mt-1.5">
        <button type="button" onClick={wissen} disabled={leeg} className="text-xs muted underline disabled:opacity-40">
          Opnieuw tekenen
        </button>
      </div>
    </div>
  );
}
