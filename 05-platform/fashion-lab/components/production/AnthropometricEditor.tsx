/**
 * FASHION-LAB: LUXURY ATELIER ANTHROPOMETRIC MEASUREMENT SUITE
 * 
 * Module 1: Comprehensive body measurement management:
 * - 17+ Anthropometric Landmarks (Chest, Waist, Hips, Inseam, Neck, Sleeve, Shoulder, etc.)
 * - Seamless Centimeter / Inch conversion and validation
 * - Standard sizing presets (XS, S, M, L, XL, XXL)
 * - Visual anatomical measurement guide with landmark highlights
 * - Real-time propagation to 2D pattern geometry and 3D digital human mannequin
 */

'use client';

import { useState } from 'react';
import {
  Ruler,
  User,
  Check,
  RotateCcw,
  Sparkles,
  Scale,
  Activity,
  ArrowRight,
  Info,
  Layers,
  Scissors,
} from 'lucide-react';
import { useGarmentProject, garmentStore } from '@/lib/production/store';
import { BodyMeasurementProfile, MeasurementUnit } from '@/lib/production/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';

interface SizingPreset {
  name: string;
  label: string;
  measurements: Partial<BodyMeasurementProfile>;
}

const SIZING_PRESETS: SizingPreset[] = [
  {
    name: 'XS',
    label: 'Extra Small (EU 44 / US 34)',
    measurements: {
      chestGirth: 88,
      waistGirth: 74,
      hipGirth: 90,
      neckGirth: 36,
      shoulderWidth: 40,
      frontLength: 64,
      backLength: 66,
      sleeveLength: 20,
      bicepCircumference: 29,
    },
  },
  {
    name: 'S',
    label: 'Small (EU 46-48 / US 36-38)',
    measurements: {
      chestGirth: 92,
      waistGirth: 78,
      hipGirth: 94,
      neckGirth: 37.5,
      shoulderWidth: 42,
      frontLength: 66,
      backLength: 68,
      sleeveLength: 21,
      bicepCircumference: 31,
    },
  },
  {
    name: 'M',
    label: 'Medium (EU 50-52 / US 40-42)',
    measurements: {
      chestGirth: 98,
      waistGirth: 84,
      hipGirth: 98,
      neckGirth: 39,
      shoulderWidth: 44,
      frontLength: 68,
      backLength: 70,
      sleeveLength: 22,
      bicepCircumference: 33,
    },
  },
  {
    name: 'L',
    label: 'Large (EU 54-56 / US 44-46)',
    measurements: {
      chestGirth: 104,
      waistGirth: 90,
      hipGirth: 104,
      neckGirth: 41,
      shoulderWidth: 46,
      frontLength: 70,
      backLength: 72,
      sleeveLength: 23,
      bicepCircumference: 35,
    },
  },
  {
    name: 'XL',
    label: 'Extra Large (EU 58-60 / US 48-50)',
    measurements: {
      chestGirth: 112,
      waistGirth: 98,
      hipGirth: 110,
      neckGirth: 43,
      shoulderWidth: 48,
      frontLength: 72,
      backLength: 74,
      sleeveLength: 24,
      bicepCircumference: 38,
    },
  },
];

export function AnthropometricEditor() {
  const project = useGarmentProject();
  const profile = project.bodyProfile;
  const [unit, setUnit] = useState<MeasurementUnit>('cm');
  const [activeCategory, setActiveCategory] = useState<'torso' | 'limbs' | 'heights'>('torso');
  const [activeLandmark, setActiveLandmark] = useState<string>('chestGirth');

  // Convert between cm and in
  const displayVal = (cmVal: number) => {
    if (unit === 'in') {
      return (cmVal / 2.54).toFixed(1);
    }
    return Math.round(cmVal);
  };

  const handleInputChange = (field: keyof BodyMeasurementProfile, rawVal: string) => {
    let num = parseFloat(rawVal);
    if (isNaN(num)) return;
    if (unit === 'in') {
      num = num * 2.54; // convert back to internal cm
    }
    garmentStore.updateBodyMeasurements({ [field]: num });
  };

  const handleApplyPreset = (preset: SizingPreset) => {
    if (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(preset.name)) {
      garmentStore.gradeToSize(preset.name as any);
    } else {
      garmentStore.updateBodyMeasurements(preset.measurements);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Measurements"
        meta={<>Profile: {profile.name}</>}
        description="Enter body measurements. The pattern, 3D body and cutting layout update automatically."
        actions={
          <SegmentedControl
            label="Measurement unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'cm', label: 'cm' },
              { value: 'in', label: 'in' },
            ]}
          />
        }
      />

      {/* Sizing Presets Strip */}
      <Card className="p-6 space-y-4">
        <CardHeader title="Start from a standard size" description="Fills every measurement from a ready-to-wear size. You can adjust them afterwards." />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SIZING_PRESETS.map((preset) => {
            const isMatch = Math.abs(profile.chestGirth - (preset.measurements.chestGirth || 0)) < 2;

            return (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group ${
                  isMatch
                    ? 'bg-brand-soft border-brand shadow-xs'
                    : 'bg-surface border-line hover:border-accent hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-semibold font-mono ${isMatch ? 'text-brand' : 'text-ink'}`}>
                    {preset.name}
                  </span>
                  {isMatch && (
                    <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-2 mt-1 font-medium">{preset.label}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Measurement Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Categorized Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden">
            {/* Category Navigation Bar */}
            <div className="border-b border-line px-6 py-3 bg-surface flex items-center gap-2">
              <button
                onClick={() => setActiveCategory('torso')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'torso'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-2 hover:text-ink hover:bg-line'
                }`}
              >
                1. Torso & Girths
              </button>
              <button
                onClick={() => setActiveCategory('limbs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'limbs'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-2 hover:text-ink hover:bg-line'
                }`}
              >
                2. Limbs & Arms
              </button>
              <button
                onClick={() => setActiveCategory('heights')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'heights'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-2 hover:text-ink hover:bg-line'
                }`}
              >
                3. Vertical Lengths
              </button>
            </div>

            {/* Inputs Body */}
            <div className="p-6 min-h-[480px]">
              {activeCategory === 'torso' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onMouseEnter={() => setActiveLandmark('chestGirth')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Chest / Bust Circumference</label>
                      <span className="text-xs text-muted font-mono">POM-01</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.chestGirth)}
                        onChange={(e) => handleInputChange('chestGirth', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Horizontal circumference around fullest apex of the chest.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('waistGirth')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Natural Waist Circumference</label>
                      <span className="text-xs text-muted font-mono">POM-02</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.waistGirth)}
                        onChange={(e) => handleInputChange('waistGirth', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Narrowest waist indentation above the navel.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('hipGirth')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Full Hip Circumference</label>
                      <span className="text-xs text-muted font-mono">POM-03</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.hipGirth)}
                        onChange={(e) => handleInputChange('hipGirth', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Widest circumference around the buttocks / seat.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('neckGirth')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Neck Base Circumference</label>
                      <span className="text-xs text-muted font-mono">POM-04</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.neckGirth)}
                        onChange={(e) => handleInputChange('neckGirth', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Base of neck where a collar or rib band rests.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('armholeCircumference')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Armhole Scye Circumference</label>
                      <span className="text-xs text-muted font-mono">POM-05</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.armholeCircumference)}
                        onChange={(e) => handleInputChange('armholeCircumference', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Vertical loop through armpit and shoulder tip.</p>
                  </div>
                </div>
              )}

              {activeCategory === 'limbs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onMouseEnter={() => setActiveLandmark('shoulderWidth')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Cross Shoulder Breadth</label>
                      <span className="text-xs text-muted font-mono">POM-06</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.shoulderWidth)}
                        onChange={(e) => handleInputChange('shoulderWidth', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Shoulder bone to shoulder bone across upper back.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('sleeveLength')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Sleeve Length</label>
                      <span className="text-xs text-muted font-mono">POM-07</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.sleeveLength)}
                        onChange={(e) => handleInputChange('sleeveLength', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Shoulder point down to desired cuff hem.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('bicepCircumference')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Bicep Circumference</label>
                      <span className="text-xs text-muted font-mono">POM-08</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.bicepCircumference)}
                        onChange={(e) => handleInputChange('bicepCircumference', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Fullest girth of relaxed upper arm.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('wristCircumference')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Wrist Circumference</label>
                      <span className="text-xs text-muted font-mono">POM-09</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.wristCircumference)}
                        onChange={(e) => handleInputChange('wristCircumference', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Circumference over wrist bone.</p>
                  </div>
                </div>
              )}

              {activeCategory === 'heights' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onMouseEnter={() => setActiveLandmark('height')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Full Body Height</label>
                      <span className="text-xs text-muted font-mono">POM-10</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.height)}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Top of head to floor barefoot.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('backLength')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Center Back Length</label>
                      <span className="text-xs text-muted font-mono">POM-11</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.backLength)}
                        onChange={(e) => handleInputChange('backLength', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">C7 back neck bone down spine to hem.</p>
                  </div>

                  <div
                    onMouseEnter={() => setActiveLandmark('inseam')}
                    className="p-4 rounded-xl border border-line hover:border-brand bg-surface/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-ink">Inseam Leg Length</label>
                      <span className="text-xs text-muted font-mono">POM-12</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={displayVal(profile.inseam)}
                        onChange={(e) => handleInputChange('inseam', e.target.value)}
                        className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                      <span className="text-xs font-semibold text-brand font-mono">{unit}</span>
                    </div>
                    <p className="text-xs text-ink-2">Crotch fork along inner leg to floor.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Interactive Landmark Croquis & Propagation Summary */}
        <div className="space-y-6">
          {/* Anatomical Landmark Visualizer Card */}
          <div className="bg-white rounded-2xl p-6 border border-line shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <User className="w-4 h-4 text-brand" />
                <span>Anatomical Landmark Guide</span>
              </h3>
              <span className="text-xs font-mono font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
                ISO 8559-1
              </span>
            </div>

            {/* Stylized Minimalist Tailoring Croquis SVG */}
            <div className="relative w-full h-72 bg-gradient-to-b from-surface to-brand-soft/40 rounded-xl flex items-center justify-center p-4 border border-line overflow-hidden">
              <svg viewBox="-10 0 220 320" className="h-full w-auto">
                {/* Body Outline */}
                <path
                  d="M 100 20 C 108 20 114 26 114 34 C 114 42 108 48 100 48 C 92 48 86 42 86 34 C 86 26 92 20 100 20 Z"
                  fill="#CBD5E1"
                />
                <path
                  d="M 96 48 L 96 58 L 104 58 L 104 48 Z"
                  fill="#94A3B8"
                />
                {/* Torso */}
                <path
                  d="M 72 64 L 62 110 L 74 150 L 70 200 L 86 295 L 94 295 L 98 170 L 102 170 L 106 295 L 114 295 L 130 200 L 126 150 L 138 110 L 128 64 Z"
                  fill="#E2E8F0"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                />
                {/* Arms */}
                <path
                  d="M 62 70 L 46 140 L 42 195 L 48 195 L 56 142 L 68 85 Z"
                  fill="#CBD5E1"
                />
                <path
                  d="M 138 70 L 154 140 L 158 195 L 152 195 L 144 142 L 132 85 Z"
                  fill="#CBD5E1"
                />

                {/* Highlighted Landmark Lines */}
                {/* Chest Landmark */}
                <line
                  x1="58" y1="100" x2="142" y2="100"
                  stroke={activeLandmark === 'chestGirth' ? '#245C46' : '#94A3B8'}
                  strokeWidth={activeLandmark === 'chestGirth' ? '3' : '1.5'}
                  strokeDasharray="3 2"
                />
                <circle cx="100" cy="100" r="3" fill={activeLandmark === 'chestGirth' ? '#245C46' : '#64748B'} />

                {/* Waist Landmark */}
                <line
                  x1="66" y1="135" x2="134" y2="135"
                  stroke={activeLandmark === 'waistGirth' ? '#245C46' : '#94A3B8'}
                  strokeWidth={activeLandmark === 'waistGirth' ? '3' : '1.5'}
                  strokeDasharray="3 2"
                />
                <circle cx="100" cy="135" r="3" fill={activeLandmark === 'waistGirth' ? '#245C46' : '#64748B'} />

                {/* Hips Landmark */}
                <line
                  x1="70" y1="165" x2="130" y2="165"
                  stroke={activeLandmark === 'hipGirth' ? '#245C46' : '#94A3B8'}
                  strokeWidth={activeLandmark === 'hipGirth' ? '3' : '1.5'}
                  strokeDasharray="3 2"
                />
                <circle cx="100" cy="165" r="3" fill={activeLandmark === 'hipGirth' ? '#245C46' : '#64748B'} />

                {/* Shoulder Landmark */}
                <line
                  x1="68" y1="64" x2="132" y2="64"
                  stroke={activeLandmark === 'shoulderWidth' ? '#245C46' : '#94A3B8'}
                  strokeWidth={activeLandmark === 'shoulderWidth' ? '3' : '1.5'}
                />

                {/* Sleeve Landmark */}
                <line
                  x1="138" y1="70" x2="158" y2="195"
                  stroke={activeLandmark === 'sleeveLength' ? '#245C46' : 'transparent'}
                  strokeWidth="3"
                />
              </svg>
            </div>

            <div className="bg-surface p-3.5 rounded-xl border border-line text-xs space-y-1">
              <span className="font-semibold text-ink block">Hover any landmark on the left</span>
              <p className="text-ink-2 leading-relaxed">
                The visual guide highlights exact anatomical tape placement conforming to British and ISO tailoring standards.
              </p>
            </div>
          </div>

          {/* Real-time Propagation Card */}
          <div className="bg-ink text-white p-6 rounded-2xl shadow-sm space-y-3 border border-sidebar-line">
            <div className="flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Real-Time Engine Sync</span>
            </div>
            <p className="text-xs text-line/80 leading-relaxed">
              Every value you change here immediately recomputes:
            </p>
            <ul className="text-xs space-y-1.5 text-line/90">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent" />
                <span>Front & Back Bodice Pattern Widths</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent" />
                <span>Sleeve Cap Insertion Ease (+3%)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent" />
                <span>3D Mannequin Proportions & Colliders</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent" />
                <span>Fabric Roll Marker Nesting Efficiency</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
