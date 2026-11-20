'use client';

import { useEffect, useRef } from 'react';

interface QRCodeDisplayProps {
  address: string;
}

export default function QRCodeDisplay({ address }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && address) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Simple QR code-like pattern (in production, use a QR library)
        const cellSize = 8;
        const margin = 20;
        const size = (canvas.width - margin * 2) / cellSize;
        
        // Draw QR code pattern
        ctx.fillStyle = '#0a0e1a';
        
        // Position markers
        const positions = [
          [1, 1], [1, size - 8], [size - 8, 1]
        ];
        
        positions.forEach(([x, y]) => {
          // Outer square
          ctx.fillRect(margin + x * cellSize, margin + y * cellSize, 7 * cellSize, 7 * cellSize);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(margin + (x + 1) * cellSize, margin + (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
          ctx.fillStyle = '#0a0e1a';
          ctx.fillRect(margin + (x + 2) * cellSize, margin + (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
        });
        
        // Draw simulated random QR data
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (Math.random() > 0.6 && 
                    !((i < 8 && j < 8) || (i < 8 && j > size - 9) || (i > size - 9 && j < 8))) {
                     ctx.fillStyle = '#0a0e1a';
                     ctx.fillRect(margin + i * cellSize, margin + j * cellSize, cellSize, cellSize);
                }
            }
        }
        
        // Draw address text
        ctx.fillStyle = '#0a0e1a';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(address.substring(0, 12) + '...', canvas.width / 2, canvas.height - 10);
      }
    }
  }, [address]);

  return (
    <div className="inline-block p-5 bg-white rounded-xl shadow-lg shadow-cyan/30">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        className="rounded-lg"
      />
    </div>
  );
}
