import React, { useState, useRef, useEffect, useCallback, type ChangeEvent, type MouseEvent } from 'react';
import { FaPalette, FaTimes } from 'react-icons/fa';
import { useTool } from '../../context/ToolContext';

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Helper: HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// Helper: RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Number(x) || 0)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

// Helper: Hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  let cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const ColorPalette: React.FC = () => {
  const { color, setColor } = useTool();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [rgb, setRgb] = useState<RGB>({ r: 0, g: 0, b: 0 });
  const [hexInput, setHexInput] = useState<string>('#000000');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef<boolean>(false);

  // Sync internal states when context color changes
  useEffect(() => {
    if (color) {
      setHexInput(color);
      const parsed = hexToRgb(color);
      if (parsed) {
        setRgb({ r: parsed[0], g: parsed[1], b: parsed[2] });
      }
    }
  }, [color]);

  // Draw the Color Wheel
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = canvas.width / 2;
    const image = ctx.createImageData(canvas.width, canvas.height);
    const data = image.data;

    for (let x = -radius; x < radius; x++) {
      for (let y = -radius; y < radius; y++) {
        const distance = Math.sqrt(x * x + y * y);
        const index = ((y + radius) * canvas.width + (x + radius)) * 4;

        if (distance <= radius) {
          let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
          if (angle < 0) angle += 360;
          const sat = (distance / radius) * 100;
          const [r, g, b] = hslToRgb(angle, sat, 50);

          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        } else {
          data[index + 3] = 0;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [isOpen]);

  // Pick color from canvas coordinates
  const pickColor = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if (pixel[3] > 0) {
        const newHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        setRgb({ r: pixel[0], g: pixel[1], b: pixel[2] });
        setHexInput(newHex);
        setColor(newHex);
      }
    },
    [setColor]
  );

  const handleRgbChange = (channel: keyof RGB, val: string) => {
    const num = Math.max(0, Math.min(255, parseInt(val, 10) || 0));
    const nextRgb = { ...rgb, [channel]: num };
    setRgb(nextRgb);
    const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    setHexInput(nextHex);
    setColor(nextHex);
  };

  const handleHexChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    const parsed = hexToRgb(val);
    if (parsed) {
      setRgb({ r: parsed[0], g: parsed[1], b: parsed[2] });
      setColor(val.startsWith('#') ? val : `#${val}`);
    }
  };

  return (
    <li className="relative list-none">
      {/* Icon Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-2 rounded hover:bg-gray-100 transition-colors"
      >
        <FaPalette size={24} style={{ color: color || '#000' }} />
      </button>

      {/* Floating Popup Window */}
      {isOpen && (
        <div
          // Prevent any mouse interactions inside this menu from reaching outer canvas listeners
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-full top-0 ml-3 z-50 p-4 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col items-center gap-3 w-56 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full pb-1 border-b border-gray-100">
            <span className="text-xs font-semibold uppercase text-gray-500">Color Picker</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-gray-700"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Color Wheel Canvas */}
          <canvas
            ref={canvasRef}
            width={160}
            height={160}
            className="cursor-crosshair rounded-full shadow-inner"
            onMouseDown={(e) => {
              e.stopPropagation();
              isDragging.current = true;
              pickColor(e);
            }}
            onMouseMove={(e) => {
              e.stopPropagation();
              if (isDragging.current) pickColor(e);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              isDragging.current = false;
            }}
            onMouseLeave={() => {
              isDragging.current = false;
            }}
          />

          {/* Active Color Preview */}
          <div
            className="w-full h-5 rounded border border-gray-200 shadow-inner"
            style={{ backgroundColor: hexInput }}
          />

          {/* RGB Inputs */}
          <div className="grid grid-cols-3 gap-1.5 w-full text-xs">
            {(['r', 'g', 'b'] as (keyof RGB)[]).map((ch) => (
              <label key={ch} className="flex flex-col items-center">
                <span className="uppercase text-gray-400 font-bold">{ch}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, e.target.value)}
                  className="w-full border border-gray-300 rounded p-1 text-center font-mono focus:outline-blue-500"
                />
              </label>
            ))}
          </div>

          {/* HEX Input */}
          <div className="w-full text-xs">
            <label className="flex items-center gap-1.5">
              <span className="uppercase text-gray-400 font-bold">HEX</span>
              <input
                type="text"
                maxLength={7}
                value={hexInput}
                onChange={handleHexChange}
                className="w-full border border-gray-300 rounded p-1 text-center font-mono focus:outline-blue-500"
              />
            </label>
          </div>
        </div>
      )}
    </li>
  );
};

export default ColorPalette;