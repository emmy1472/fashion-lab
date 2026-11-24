/**
 * FASHION-LAB: FACTORY TECHNICAL SPECIFICATION SHEET (TECH PACK)
 * 
 * Generates factory-ready technical specifications:
 * - Product sketch & Points of Measure (POM)
 * - Bill of Materials (BOM) & Trims
 * - Seam construction & Stitching types (SPI)
 * - Cutting consumption & marker efficiency
 * - Ironing & finishing instructions
 */

'use client';

import { X, Printer, Download, CheckCircle2, FileText, Sparkles, Scissors, Layers } from 'lucide-react';
import { useGarmentProject } from '@/lib/production/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TechPackModal({ isOpen, onClose }: Props) {
  const project = useGarmentProject();
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSpec = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_tech_pack.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B1A15] border border-[#164134] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-brand-strong bg-[#0A2018] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Production Tech Pack & Factory Spec Sheet</span>
                <span className="text-xs bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                  REV {project.version}.0
                </span>
              </h2>
              <span className="text-xs text-muted">Standard Garment Manufacturing Specification</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#122D24] hover:bg-[#183B30] text-xs font-semibold text-gray-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={handleDownloadSpec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success hover:bg-[#0E9F6E] text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#122D24] text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tech Pack Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#091512]">
          {/* Header Metadata Block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0A2018] p-5 rounded-2xl border border-brand-strong text-xs">
            <div>
              <span className="text-muted uppercase tracking-wider text-xs block">Style Name</span>
              <strong className="text-white text-sm mt-0.5 block">{project.name}</strong>
            </div>
            <div>
              <span className="text-muted uppercase tracking-wider text-xs block">Garment Category</span>
              <strong className="text-emerald-400 text-sm mt-0.5 block uppercase">{project.garmentCategory}</strong>
            </div>
            <div>
              <span className="text-muted uppercase tracking-wider text-xs block">Base Size / Profile</span>
              <strong className="text-white text-sm mt-0.5 block">{project.bodyProfile.name}</strong>
            </div>
            <div>
              <span className="text-muted uppercase tracking-wider text-xs block">Date Created</span>
              <strong className="text-line-strong font-mono mt-0.5 block">
                {new Date(project.updatedAt).toLocaleDateString()}
              </strong>
            </div>
          </div>

          {/* Points of Measure (POM) Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Points of Measure (POM) Specifications
            </h3>
            <div className="bg-[#0A2018] rounded-2xl border border-brand-strong overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#061510] text-muted text-xs uppercase border-b border-brand-strong">
                  <tr>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Measurement Description</th>
                    <th className="py-2.5 px-4 font-mono">Spec (cm)</th>
                    <th className="py-2.5 px-4 font-mono">Tolerance (±)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#102B21] text-gray-200">
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-emerald-400">POM-01</td>
                    <td className="py-2.5 px-4 font-medium">Chest Circumference (1&quot; below armhole)</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-white">
                      {project.bodyProfile.chestGirth + 7} cm
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted">0.5 cm</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-emerald-400">POM-02</td>
                    <td className="py-2.5 px-4 font-medium">Total Center Back Body Length (from HPS)</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-white">{project.bodyProfile.backLength} cm</td>
                    <td className="py-2.5 px-4 font-mono text-muted">0.5 cm</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-emerald-400">POM-03</td>
                    <td className="py-2.5 px-4 font-medium">Cross Shoulder Breadth (seam to seam)</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-white">{project.bodyProfile.shoulderWidth} cm</td>
                    <td className="py-2.5 px-4 font-mono text-muted">0.4 cm</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-emerald-400">POM-04</td>
                    <td className="py-2.5 px-4 font-medium">Sleeve Length (from shoulder point)</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-white">{project.bodyProfile.sleeveLength} cm</td>
                    <td className="py-2.5 px-4 font-mono text-muted">0.4 cm</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-emerald-400">POM-05</td>
                    <td className="py-2.5 px-4 font-medium">Neckline Opening Width</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-white">16.8 cm</td>
                    <td className="py-2.5 px-4 font-mono text-muted">0.3 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Primary Material & Trims BOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5" /> Primary Fabric & Cutting Spec
              </h3>
              <div className="bg-[#0A2018] p-4 rounded-2xl border border-brand-strong space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Material Name:</span>
                  <strong className="text-white">{project.fabric.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fabric Weight:</span>
                  <strong className="text-emerald-400 font-mono">{project.fabric.weightGSM} GSM</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Thickness:</span>
                  <strong className="text-white font-mono">{project.fabric.thicknessMm} mm</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fabric Consumption:</span>
                  <strong className="text-emerald-400 font-mono">
                    {(project.cuttingPlan.totalLengthMm / 1000).toFixed(2)} m per garment
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Marker Efficiency:</span>
                  <strong className="text-emerald-300 font-mono">{project.cuttingPlan.efficiencyPercentage}%</strong>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Trims & Findings BOM
              </h3>
              <div className="bg-[#0A2018] p-4 rounded-2xl border border-brand-strong space-y-2 text-xs">
                {project.components.map((c) => (
                  <div key={c.id} className="flex justify-between border-b border-[#102B21] pb-1.5 last:border-0">
                    <div>
                      <span className="text-white font-semibold block">{c.name}</span>
                      <span className="text-xs text-muted font-mono">{c.materialName}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-semibold whitespace-nowrap">
                      {c.quantity} {c.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Construction & Seam Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Seam Construction & Machine Matrix
            </h3>
            <div className="bg-[#0A2018] rounded-2xl border border-brand-strong p-4 text-xs space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted uppercase tracking-wider text-xs block">Standard Seams</span>
                  <p className="text-gray-200 mt-1">4-Thread Overlock (Type 514) with 10mm seam allowance, 14 SPI</p>
                </div>
                <div>
                  <span className="text-muted uppercase tracking-wider text-xs block">Hems & Cuffs</span>
                  <p className="text-gray-200 mt-1">2-Needle 6mm Bottom Coverstitch (Type 406) with 25mm hem allowance</p>
                </div>
                <div>
                  <span className="text-muted uppercase tracking-wider text-xs block">Shoulder Reinforcement</span>
                  <p className="text-gray-200 mt-1">6mm Mobilon clear elastic stabilizer inserted into front seam</p>
                </div>
                <div>
                  <span className="text-muted uppercase tracking-wider text-xs block">Neckband Attachment</span>
                  <p className="text-gray-200 mt-1">4-quarter notched rib attached with 1:0.82 differential stretch ratio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
