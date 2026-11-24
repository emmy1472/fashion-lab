"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Save,
  Download,
  ChevronDown,
  Check,
  FolderKanban,
  Share2,
  Bell,
  Play,
  RotateCcw,
  RotateCw,
  Scissors,
  Layers,
  Sparkles,
  Activity,
  FileText,
  Columns2,
  Maximize2,
  Box,
  Palette,
} from "lucide-react";
import { useGarmentProject, useGarmentSaveStatus } from "@/lib/production/store";
import { downloadDxfAamaFile } from "@/lib/production/exportDxfAama";

export type StudioMode = 'cad' | 'artwork';

const STUDIO_MODES: { id: StudioMode; label: string; icon: React.ElementType }[] = [
  { id: 'cad', label: 'Pattern', icon: Scissors },
  { id: 'artwork', label: 'Artwork', icon: Palette },
];
export type LayoutMode = 'split' | 'split50' | 'split60' | 'split40' | 'max3d' | 'max2d';

interface Props {
  activeMode?: StudioMode;
  layoutMode?: LayoutMode;
  onModeChange?: (mode: StudioMode) => void;
  onLayoutChange?: (layout: LayoutMode) => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExport?: (format: "png" | "svg" | "pdf" | "zip") => void;
  onOpenDemo?: () => void;
  onOpenOutfitBuilder?: () => void;
  isSaving?: boolean;
}

export function StudioHeader({
  activeMode = "cad",
  layoutMode = "split",
  onModeChange,
  onLayoutChange,
  onSave,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = false,
  onExport,
  onOpenDemo,
  onOpenOutfitBuilder,
  isSaving = false,
}: Props) {
  const project = useGarmentProject();
  const saveStatus = useGarmentSaveStatus();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleShare = () => {
    setIsShared(true);
    navigator.clipboard?.writeText(window.location.href);
    setTimeout(() => setIsShared(false), 2500);
  };

  const handleExportSelect = (format: "png" | "svg" | "pdf" | "zip") => {
    setShowExportMenu(false);
    if (onExport) onExport(format);
  };

  return (
    <header className="h-12 bg-white border-b border-line px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-20 select-none">
      {/* Left: Mode switch + Undo / Redo */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          role="tablist"
          aria-label="Studio mode"
          className="flex items-center gap-0.5 bg-surface p-0.5 rounded-lg border border-line"
        >
          {STUDIO_MODES.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onModeChange?.(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[13px] font-medium transition cursor-pointer ${
                  isActive ? 'bg-white text-ink shadow-xs' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Undo / Redo controls */}
        <div className="hidden md:flex items-center gap-1 bg-surface p-1 rounded-xl border border-line">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              canUndo
                ? "text-ink hover:bg-white hover:shadow-2xs"
                : "text-muted opacity-50 cursor-not-allowed"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              canRedo
                ? "text-ink hover:bg-white hover:shadow-2xs"
                : "text-muted opacity-50 cursor-not-allowed"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Split View Layout Toggles (50/50, 60/40, 40/60, Max 3D, Max 2D CAD) */}
      {onLayoutChange && activeMode === 'cad' && (
        <div className="hidden lg:flex items-center gap-1 bg-surface p-1 rounded-xl border border-line">
          <button
            type="button"
            onClick={() => onLayoutChange('split50')}
            title="Split 50/50 View"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              layoutMode === 'split' || layoutMode === 'split50'
                ? 'bg-white text-brand shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>50/50</span>
          </button>

          <button
            type="button"
            onClick={() => onLayoutChange('split60')}
            title="Split 60% 3D / 40% 2D"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              layoutMode === 'split60'
                ? 'bg-white text-brand shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span>60/40</span>
          </button>

          <button
            type="button"
            onClick={() => onLayoutChange('split40')}
            title="Split 40% 3D / 60% 2D"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              layoutMode === 'split40'
                ? 'bg-white text-brand shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span>40/60</span>
          </button>

          <button
            type="button"
            onClick={() => onLayoutChange('max3d')}
            title="Maximize 3D Viewport"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              layoutMode === 'max3d'
                ? 'bg-white text-brand shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Full 3D</span>
          </button>

          <button
            type="button"
            onClick={() => onLayoutChange('max2d')}
            title="Maximize 2D CAD Pattern Editor"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              layoutMode === 'max2d'
                ? 'bg-white text-brand shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Full 2D</span>
          </button>
        </div>
      )}

      {/* Right: Actions (Share, Save, Export) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          title={isShared ? "Link Copied!" : "Share Project"}
          className={`p-2 rounded-xl border transition shadow-2xs cursor-pointer ${
            isShared
              ? "bg-brand-soft text-brand border-brand"
              : "bg-white border-line text-ink-2 hover:text-ink hover:bg-surface"
          }`}
        >
          {isShared ? <Check className="w-4 h-4 text-brand" /> : <Share2 className="w-4 h-4" />}
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || saveStatus.status === 'saving'}
          className="flex items-center gap-1.5 bg-white border border-line hover:bg-surface text-ink text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer active:scale-95"
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-brand" />
              <span className="text-brand">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-ink-2" />
              <span>{isSaving || saveStatus.status === 'saving' ? "Saving..." : "Save"}</span>
            </>
          )}
        </button>

        {/* Export Dropdown Trigger (Forest Green luxury filled) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {/* Export Options Menu */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-line py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                onClick={() => handleExportSelect("svg")}
                className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-brand-soft hover:text-brand flex items-center justify-between font-medium transition cursor-pointer"
              >
                <span>Production CAD (SVG)</span>
                <span className="text-[10px] text-muted font-mono">Vector</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  downloadDxfAamaFile(project);
                }}
                className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-brand-soft hover:text-brand flex items-center justify-between font-medium transition cursor-pointer"
              >
                <span>Plotter CAD (DXF-AAMA)</span>
                <span className="text-[10px] text-brand font-bold font-mono">.DXF</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportSelect("png")}
                className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-brand-soft hover:text-brand flex items-center justify-between font-medium transition cursor-pointer"
              >
                <span>Mockup (300 DPI PNG)</span>
                <span className="text-[10px] text-muted font-mono">Raster</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportSelect("pdf")}
                className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-brand-soft hover:text-brand flex items-center justify-between font-medium transition cursor-pointer"
              >
                <span>Factory Tech Pack (PDF)</span>
                <span className="text-[10px] text-muted font-mono">Specs</span>
              </button>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                onClick={() => handleExportSelect("zip")}
                className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-brand-soft hover:text-brand flex items-center justify-between font-medium transition cursor-pointer"
              >
                <span>Complete Production Package</span>
                <span className="text-[10px] text-brand font-bold font-mono">.ZIP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
