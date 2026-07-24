"use client";

import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { buildSeedAnalysis } from "@/data/seed";
import { saveAnalysis } from "@/lib/storage/analysisStorage";

export function LoadDemoButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const demo = buildSeedAnalysis();
        saveAnalysis(demo);
        router.push(`/analysis/${demo.id}`);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-dashed border-purple/50 px-4 py-2 text-sm font-medium text-purple transition hover:bg-purple/10"
    >
      <FlaskConical size={16} />
      Carregar demonstração (Västerås SK x Örgryte)
    </button>
  );
}
