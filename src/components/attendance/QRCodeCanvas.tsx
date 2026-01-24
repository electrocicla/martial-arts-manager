/**
 * QRCodeCanvas Component
 *
 * Generates scannable QR codes using a standard implementation.
 * Uses the browser Canvas API and the qrcode library.
 */

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  id: string;
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export default function QRCodeCanvas({
  id,
  value,
  size = 150,
  bgColor = '#ffffff',
  fgColor = '#000000'
}: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    }).catch((error) => {
      console.error('QR render error:', error);
    });
  }, [value, size, bgColor, fgColor]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated',
        width: size,
        height: size,
      }}
    />
  );
}
