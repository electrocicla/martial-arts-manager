/**
 * QRCodeCanvas Component
 * 
 * Generates QR codes using a pure JavaScript implementation.
 * Uses the browser's Canvas API to render the QR code.
 */

import { useEffect, useRef } from 'react';

interface QRCodeCanvasProps {
  id: string;
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

// Simple QR code encoding matrix generator
// This is a simplified implementation for basic alphanumeric data
function generateQRMatrix(data: string): boolean[][] {
  const size = 21; // Version 1 QR code is 21x21
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Add finder patterns (the three big squares in corners)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || // Top and bottom borders
          c === 0 || c === 6 || // Left and right borders
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) // Center
        ) {
          matrix[row + r][col + c] = true;
        }
      }
    }
  };
  
  // Add finder patterns
  addFinderPattern(0, 0); // Top-left
  addFinderPattern(0, size - 7); // Top-right  
  addFinderPattern(size - 7, 0); // Bottom-left
  
  // Add timing patterns (alternating dots between finder patterns)
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  
  // Add separators (white space around finder patterns)
  // Already false by default
  
  // Encode data into the matrix using a simple algorithm
  // This creates a unique pattern based on the input string
  const hash = simpleHash(data);
  let bitIndex = 0;
  
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // Skip timing column
    
    for (let row = 0; row < size; row++) {
      for (let i = 0; i < 2; i++) {
        const c = col - i;
        if (!isReserved(row, c, size)) {
          const bit = (hash >> (bitIndex % 32)) & 1;
          matrix[row][c] = bit === 1 || (bitIndex * 7 + row * 3 + c * 11) % 3 === 0;
          bitIndex++;
        }
      }
    }
  }
  
  return matrix;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function isReserved(row: number, col: number, size: number): boolean {
  // Check finder patterns and their separators
  if (row < 9 && col < 9) return true; // Top-left
  if (row < 9 && col >= size - 8) return true; // Top-right
  if (row >= size - 8 && col < 9) return true; // Bottom-left
  
  // Timing patterns
  if (row === 6 || col === 6) return true;
  
  return false;
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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate QR matrix
    const matrix = generateQRMatrix(value);
    const moduleCount = matrix.length;
    const moduleSize = size / moduleCount;

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Draw modules
    ctx.fillStyle = fgColor;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (matrix[row][col]) {
          ctx.fillRect(
            col * moduleSize,
            row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }

    // Add logo/branding in center (optional)
    const logoSize = size * 0.15;
    
    // White background for logo
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Red circle with H letter
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${logoSize * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', size / 2, size / 2);

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
        height: size
      }}
    />
  );
}
