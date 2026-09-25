import React, { useMemo, useState } from 'react';
import { FaPalette, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useTool } from '../../context/ToolContext';

interface RgbaState {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseRgba = (value: string): RgbaState => {
  const normalized = value.replace(/\s+/g, '');
  const match = normalized.match(/^rgba?\((\d+),(\d+),(\d+)(?:,(\d*\.?\d+))?\)$/i);

  if (!match) {
    return { r: 255, g: 0, b: 0, a: 1 };
  }

  const parsedAlpha = match[4] !== undefined ? Number(match[4]) : 1;

  return {
    r: clamp(Number(match[1]) || 0, 0, 255),
    g: clamp(Number(match[2]) || 0, 0, 255),
    b: clamp(Number(match[3]) || 0, 0, 255),
    a: clamp(Number.isFinite(parsedAlpha) ? parsedAlpha : 1, 0, 1),
  };
};

const toRgbaString = (value: RgbaState) =>
  `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a})`;

export const ColorPalette: React.FC = () => {
  const { color, setColor, thickness, setThickness } = useTool();
  const [isOpen, setIsOpen] = useState(false);

  const rgba = useMemo(() => parseRgba(color), [color]);

  const updateRgba = (next: RgbaState) => {
    setColor(toRgbaString(next));
  };

  const handleColorChange = (channel: keyof Omit<RgbaState, 'a'>, value: string) => {
    const parsedValue = Number(value);
    const next = { ...rgba, [channel]: clamp(Number.isFinite(parsedValue) ? parsedValue : 0, 0, 255) };
    updateRgba(next);
  };

  const handleAlphaChange = (value: string) => {
    const parsedValue = Number(value);
    const next = { ...rgba, a: clamp(Number.isFinite(parsedValue) ? parsedValue : 1, 0, 1) };
    updateRgba(next);
  };

  const handleThicknessChange = (nextValue: number) => {
    setThickness(clamp(nextValue, 1, 15));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Stroke</span>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            aria-label="Increase stroke thickness"
            onClick={() => handleThicknessChange(thickness + 0.1)}
            className="thickness-up flex h-6 w-full items-center justify-center rounded border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            <FaArrowUp />
          </button>

          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={15}
            step={0.1}
            value={thickness}
            onChange={(event) => handleThicknessChange(Number(event.target.value || 1))}
            className="h-9 w-full rounded border border-slate-200 bg-white px-2 text-center text-sm font-medium text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            aria-label="Decrease stroke thickness"
            onClick={() => handleThicknessChange(thickness - 0.1)}
            className="thickness-down flex h-6 w-full items-center justify-center rounded  bg-slate-50 hover:bg-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <FaArrowDown />
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-100"
        >
          <FaPalette size={16} style={{ color: color || '#000000' }} />
        </button>

        {isOpen && (
          <div className="absolute left-full top-0 ml-3 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-300/40">
            <div className="mb-3 flex h-5 w-full rounded border border-slate-200" style={{ background: color }} />

            <div className="grid grid-cols-2 gap-2">
              {(['r', 'g', 'b'] as const).map((channel) => (
                <label key={channel} className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {channel}
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgba[channel]}
                    onChange={(event) => handleColorChange(channel, event.target.value)}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              ))}

              <label className="col-span-2 flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Alpha
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={rgba.a}
                  onChange={(event) => handleAlphaChange(event.target.value)}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPalette;