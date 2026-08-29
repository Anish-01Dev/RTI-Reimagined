import { useEffect, useRef } from "react";
import QRCode from "qrcode";

/** Renders a real QR code client-side (the `qrcode` package draws to
 * canvas locally — no network call, no external QR-generation service).
 * Kept deliberately small and framed as supporting evidence, not a
 * standalone spectacle — see EvidenceVerifyPage for what scanning it
 * actually verifies. */
export function QrCode({
  value,
  size = 128,
}: {
  value: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#1a1c1c", light: "#ffffff" },
    }).catch(() => {
      // Non-fatal — the certificate view still shows the link as text.
    });
  }, [value, size]);

  return (
    <canvas ref={canvasRef} width={size} height={size} className="rounded" />
  );
}
