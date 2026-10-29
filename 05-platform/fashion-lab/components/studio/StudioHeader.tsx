"use client";

import { useState } from "react";
import {
  Save,
  Download,
  ChevronDown,
  Check,
  FolderKanban,
  Share2,
  Bell,
  Play,
  User,
} from "lucide-react";

interface Props {
  projectName?: string;
  onSave?: () => void;
  onExport?: (format: "png" | "svg" | "pdf" | "zip") => void;
  onOpenDemo?: () => void;
  onOpenOutfitBuilder?: () => void;
  isSaving?: boolean;
}

export function StudioHeader({
  projectName = "Urban Jacket Collection",
  onSave,
  onExport,
  onOpenDemo,
  onOpenOutfitBuilder,
  isSaving = false,
}: Props) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleSave = () => {
    if (onSave) onSave();
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
    <header className="h-16 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs select-none">
      {/* Title & Subtitle matching mockup */}
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-gray-900 leading-tight">
          Design Studio
        </h1>
        <p className="text-[11px] text-gray-500 font-medium">
          Create, customize and visualize your garments in 2D and 3D.
        </p>
      </div>

      {/* Action Strip matching mockup */}
      <div className="flex items-center gap-3">
        {/* Watch Scratch Demo Video Button */}
        {onOpenDemo && (
          <button
            type="button"
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 bg-[#ECFDF5] hover:bg-emerald-100 border border-[#10B981]/40 text-[#0E6E55] text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Demo</span>
          </button>
        )}

        {/* Outfit Builder / Mannequin Fit Check */}
        {onOpenOutfitBuilder && (
          <button
            type="button"
            onClick={onOpenOutfitBuilder}
            title="Combine two garments on a mannequin to check outfit fit"
            className="flex items-center gap-1.5 bg-[#062D24] hover:bg-[#09503E] border border-[#062D24] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Outfit Check</span>
          </button>
        )}

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2 bg-[#F8F9FA] border border-gray-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-100 transition cursor-pointer">
          <FolderKanban className="w-3.5 h-3.5 text-[#0E6E55]" />
          <span>Project: <strong className="text-gray-900">{projectName}</strong></span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>

        {/* Share Icon Button */}
        <button
          type="button"
          onClick={handleShare}
          title={isShared ? "Link Copied!" : "Share Project"}
          className={`p-2 rounded-xl border border-gray-200 transition shadow-2xs ${
            isShared ? "bg-[#ECFDF5] text-[#0E6E55] border-[#0E6E55]" : "bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {isShared ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition shadow-2xs active:scale-95"
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-gray-500" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </>
          )}
        </button>

        {/* Export Dropdown Trigger (Deep Emerald filled) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 bg-[#0E6E55] hover:bg-[#09503E] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {/* Export Options Menu */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                onClick={() => handleExportSelect("png")}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#ECFDF5] hover:text-[#0E6E55] flex items-center justify-between font-medium transition"
              >
                <span>Mockup (300 DPI PNG)</span>
                <span className="text-[10px] text-gray-400">Raster</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportSelect("svg")}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#ECFDF5] hover:text-[#0E6E55] flex items-center justify-between font-medium transition"
              >
                <span>Production CAD (SVG)</span>
                <span className="text-[10px] text-gray-400">Vector</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportSelect("pdf")}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#ECFDF5] hover:text-[#0E6E55] flex items-center justify-between font-medium transition"
              >
                <span>Factory Tech Pack (PDF)</span>
                <span className="text-[10px] text-gray-400">Spec</span>
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => handleExportSelect("zip")}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#ECFDF5] hover:text-[#0E6E55] flex items-center justify-between font-medium transition"
              >
                <span>Complete Production Package</span>
                <span className="text-[10px] text-emerald-600 font-bold">.ZIP</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition ml-1"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
        </button>

        {/* User Profile Avatar */}
        <div
          title="Emmanuel Akinmolayan"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-white text-xs ring-2 ring-emerald-500/20 cursor-pointer hover:ring-emerald-500/40 transition"
        >
          EA
        </div>
      </div>
    </header>
  );
}
