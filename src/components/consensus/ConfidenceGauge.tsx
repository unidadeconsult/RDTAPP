export function ConfidenceGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#21B66F" : score >= 4.5 ? "#F2B84B" : "#E55D5D";

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, #E7EEF5 0deg)`,
        }}
      >
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-bg-card dark:bg-[#0F1D2B]">
          <span className="font-heading text-xl font-bold text-text-primary dark:text-white">
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <div>
        <p className="font-heading text-sm font-semibold text-text-primary dark:text-white">
          Grau de confiança
        </p>
        <p className="max-w-xs text-xs text-text-secondary dark:text-white/50">
          Reflete a qualidade e completude dos dados analisados — não é a probabilidade de
          acerto da aposta.
        </p>
      </div>
    </div>
  );
}
