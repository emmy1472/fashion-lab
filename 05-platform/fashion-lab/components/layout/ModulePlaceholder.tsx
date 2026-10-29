import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";

interface Props {
  moduleName: string;
  milestone: string;
  description: string;
}

export function ModulePlaceholder({
  moduleName,
  milestone,
  description,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-10 border border-gray-200/80 shadow-xs max-w-3xl mx-auto my-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-[#0E6E55] flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-7 h-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#0E6E55] mb-3">
        <Clock className="w-3.5 h-3.5" />
        {milestone}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{moduleName}</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-6">
        {description}
      </p>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-[#0E6E55] hover:bg-[#09503E] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
