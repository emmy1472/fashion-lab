"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  GripVertical,
  Trash2,
} from "lucide-react";

interface Zone {
  id: string;
  label: string;
  role: string;
}

interface Props {
  zones: Zone[];
  selectedZoneId?: string;
  onSelectZone?: (id: string) => void;
  zoneColors: Record<string, string>;
  onColorChange: (zoneId: string, color: string) => void;
  pieceTransforms?: Record<
    string,
    {
      dx?: number;
      dy?: number;
      scaleX?: number;
      scaleY?: number;
      rotation?: number;
      outlineColor?: string;
      contourOffset?: boolean;
    }
  >;
  onTransformPiece?: (
    zoneId: string,
    delta: {
      dx?: number;
      dy?: number;
      scaleX?: number;
      scaleY?: number;
      scaleXAbs?: number;
      scaleYAbs?: number;
      rotation?: number;
      rotationAbs?: number;
      outlineColor?: string;
      contourOffset?: boolean;
      reset?: boolean;
      commitHistory?: boolean;
    }
  ) => void;
  patternScale: number;
  onPatternScaleChange: (scale: number) => void;
  layers: any[];
  selectedLayerId?: string | null;
  onSelectLayer?: (id: string | null) => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onToggleLayerLock?: (id: string) => void;
  textTypography: {
    text: string;
    fontFamily: string;
    fontSize: number;
  };
  onUpdateTypography: (typo: { text: string; fontFamily: string; fontSize: number }) => void;
}

const primarySwatches = [
  "#062D24", // Deep Forest Green
  "#C89D7C", // Warm Camel / Tan
  "#F8FAFC", // Crisp White
  "#1E3A8A", // Royal Navy
  "#10B981", // Mint Emerald
  "#111827", // Carbon Black
  "#991B1B", // Crimson
];

const DENIM_WASH_PRESETS = [
  { label: "Light Stone", color: "#6B9AC4" },
  { label: "Mid Vintage", color: "#4A7BB0" },
  { label: "Washed Black", color: "#2A2D34" },
  { label: "Raw Indigo", color: "#1E3A5F" },
  { label: "Ecru", color: "#E8E3D9" },
];

const athleticFonts = [
  "Montserrat",
  "Anton",
  "Bebas Neue",
  "Oswald",
  "Roboto Condensed",
  "Archivo Black",
];

const fontSizes = [16, 20, 22, 24, 32, 42, 60, 84, 110, 130];

export function PropertiesInspector({
  zones,
  selectedZoneId: externalZoneId,
  onSelectZone,
  zoneColors,
  onColorChange,
  pieceTransforms = {},
  onTransformPiece,
  patternScale,
  onPatternScaleChange,
  layers,
  selectedLayerId,
  onSelectLayer,
  onRemoveLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  textTypography,
  onUpdateTypography,
}: Props) {
  const [internalZoneId, setInternalZoneId] = useState<string>(zones[0]?.id || "body");
  const [currentText, setCurrentText] = useState(textTypography.text);
  const [currentFont, setCurrentFont] = useState(textTypography.fontFamily);
  const [currentSize, setCurrentSize] = useState(textTypography.fontSize);
  const [showAllSwatches, setShowAllSwatches] = useState(false);

  const selectedZoneId = externalZoneId || internalZoneId;
  const activeZoneId = zones.some((z) => z.id === selectedZoneId)
    ? selectedZoneId
    : zones[0]?.id || "body";

  const activePieceTransform = pieceTransforms[activeZoneId] || {};
  const pieceWidthPct = Math.round((activePieceTransform.scaleX ?? 1) * 100);
  const pieceHeightPct = Math.round((activePieceTransform.scaleY ?? 1) * 100);

  const handleSelectZone = (id: string) => {
    setInternalZoneId(id);
    if (onSelectZone) onSelectZone(id);
  };

  // Sync typography inputs when a text layer is selected on the canvas
  useEffect(() => {
    const sel = layers.find((l) => l.id === selectedLayerId);
    if (sel && sel.kind === "text") {
      setCurrentText(sel.text || "");
      setCurrentFont(sel.font || "Montserrat");
      setCurrentSize(sel.size || 24);
    }
  }, [selectedLayerId, layers]);

  const handleApplyTypography = () => {
    onUpdateTypography({
      text: currentText,
      fontFamily: currentFont,
      fontSize: Number(currentSize),
    });
  };

  return (
    <div className="w-[225px] bg-white border-r border-gray-200/80 flex flex-col h-full select-none shrink-0">
      {/* Aligned Column Header */}
      <div className="h-11 px-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-gray-900 tracking-tight">Properties</h3>
      </div>

      {/* Structured Inspector Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {/* 1. Colorway Section matching mockup */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-800">Colorway</span>
              <button
                type="button"
                onClick={() => setShowAllSwatches(!showAllSwatches)}
                className="text-gray-400 hover:text-gray-700"
                title="Show more swatches"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Synced Zone Selector (updates when clicking garment parts on the 2D canvas) */}
            <select
              value={activeZoneId}
              onChange={(e) => handleSelectZone(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-gray-200/80 rounded-lg px-2.5 py-1 text-[11px] font-medium text-gray-700 focus:outline-none focus:border-[#0E6E55]"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  Part: {z.label}
                </option>
              ))}
            </select>

            {/* 4 Featured Swatches Row matching mockup */}
            <div className="flex items-center gap-2 pt-0.5">
              {primarySwatches.slice(0, 4).map((color, idx) => {
                const isActive = zoneColors[activeZoneId] === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onColorChange(activeZoneId, color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 transition-transform hover:scale-105 shrink-0 ${
                      idx === 0 ? "rounded-lg" : "rounded-full"
                    } ${
                      isActive
                        ? "ring-2 ring-[#0E6E55] ring-offset-1 border border-white"
                        : "border border-gray-200"
                    }`}
                    title={`Apply ${color}`}
                  />
                );
              })}

              {/* Custom Color Input Trigger */}
              <label
                title="Custom Color"
                className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#0E6E55] text-[10px] text-gray-400 shrink-0"
              >
                +
                <input
                  type="color"
                  value={zoneColors[activeZoneId] || "#062D24"}
                  onChange={(e) => onColorChange(activeZoneId, e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>

            {showAllSwatches && (
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {primarySwatches.slice(4).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onColorChange(activeZoneId, color)}
                    style={{ backgroundColor: color }}
                    className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            )}

            {/* Modern Denim Wash Presets if garment is Jeans */}
            {zones.some((z) => (z as any).wash || z.id === "yoke") && (
              <div className="pt-2 space-y-1.5 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Denim Wash Presets
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DENIM_WASH_PRESETS.map((preset) => {
                    const isSelected = zoneColors.body === preset.color;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          onColorChange("body", preset.color);
                          onColorChange("pocket", preset.color);
                          onColorChange("cuff", preset.color);
                          onColorChange("waistband", preset.color);
                          onColorChange("placket", preset.color);
                          onColorChange("yoke", preset.color);
                        }}
                        className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md border transition-all flex items-center gap-1 ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-[#F8F9FA] text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block border border-black/20"
                          style={{ backgroundColor: preset.color }}
                        />
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CorelDRAW Piece Resize (Width & Height %) */}
            {onTransformPiece && (
              <div className="pt-2.5 mt-2 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-700">
                    Piece Size (CorelDRAW)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onTransformPiece(activeZoneId, {
                        reset: true,
                        commitHistory: true,
                      })
                    }
                    className="text-[9.5px] font-bold text-[#0E6E55] hover:underline"
                  >
                    Reset 100%
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>Width (W)</span>
                    <span className="font-bold text-gray-700">{pieceWidthPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={pieceWidthPct}
                    onChange={(e) =>
                      onTransformPiece(activeZoneId, {
                        scaleXAbs: Number(e.target.value) / 100,
                      })
                    }
                    onMouseUp={() =>
                      onTransformPiece(activeZoneId, { commitHistory: true })
                    }
                    className="w-full accent-[#0E6E55] h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>Height (H)</span>
                    <span className="font-bold text-gray-700">{pieceHeightPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={pieceHeightPct}
                    onChange={(e) =>
                      onTransformPiece(activeZoneId, {
                        scaleYAbs: Number(e.target.value) / 100,
                      })
                    }
                    onMouseUp={() =>
                      onTransformPiece(activeZoneId, { commitHistory: true })
                    }
                    className="w-full accent-[#0E6E55] h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Pattern Settings matching mockup */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <span className="text-[11px] font-bold text-gray-800 block">
              Pattern Settings
            </span>
            <div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                <span>Pattern Scale</span>
                <span className="font-semibold text-gray-700">{patternScale}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                value={patternScale}
                onChange={(e) => onPatternScaleChange(Number(e.target.value))}
                className="w-full accent-[#0E6E55] h-1 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Artwork Layers matching mockup */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <span className="text-[11px] font-bold text-gray-800 block">
              Artwork Layers
            </span>
            <div className="space-y-1">
              {layers.map((layer) => {
                const isSelected = layer.id === selectedLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer && onSelectLayer(layer.id)}
                    className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition text-[11px] cursor-pointer ${
                      isSelected
                        ? "bg-[#ECFDF5] text-[#0E6E55] font-bold ring-1 ring-[#10B981]/30"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripVertical className="w-3 h-3 text-gray-300 shrink-0" />
                      <span className="truncate">
                        {layer.name || layer.text || "Artwork"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleLayerVisibility(layer.id)}
                        className="text-gray-400 hover:text-gray-700 transition"
                        title={layer.visible ? "Hide layer" : "Show layer"}
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-gray-300" />
                        )}
                      </button>
                      {onToggleLayerLock && (
                        <button
                          type="button"
                          onClick={() => onToggleLayerLock(layer.id)}
                          className="text-gray-400 hover:text-amber-600 transition"
                          title={layer.locked ? "Unlock layer" : "Lock layer"}
                        >
                          {layer.locked ? (
                            <Lock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <Unlock className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      )}
                      {!layer.locked && (
                        <button
                          type="button"
                          onClick={() => onRemoveLayer(layer.id)}
                          className="text-gray-300 hover:text-red-500 transition"
                          title="Remove layer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Text & Typography matching mockup */}
          <div className="pt-3 border-t border-gray-100 space-y-2.5">
            <span className="text-[11px] font-bold text-gray-800 block">
              Text & Typography
            </span>

            <div>
              <label className="text-[10px] text-gray-400 font-medium block mb-1">
                Text
              </label>
              <input
                type="text"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyTypography();
                }}
                placeholder="FASHION-LAB"
                className="w-full bg-[#F8F9FA] border border-gray-200/80 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-gray-800 focus:outline-none focus:border-[#0E6E55]"
              />
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              <div className="col-span-3">
                <select
                  value={currentFont}
                  onChange={(e) => setCurrentFont(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-gray-200/80 rounded-lg px-2 py-1.5 text-[11px] text-gray-700 focus:outline-none focus:border-[#0E6E55]"
                >
                  {athleticFonts.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <select
                  value={currentSize}
                  onChange={(e) => setCurrentSize(Number(e.target.value))}
                  className="w-full bg-[#F8F9FA] border border-gray-200/80 rounded-lg px-1.5 py-1.5 text-[11px] text-gray-700 focus:outline-none focus:border-[#0E6E55]"
                >
                  {fontSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Update Action Button matching mockup */}
        <button
          type="button"
          onClick={handleApplyTypography}
          className="w-full bg-[#0E6E55] hover:bg-[#09503E] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs"
        >
          Update
        </button>
      </div>
    </div>
  );
}
