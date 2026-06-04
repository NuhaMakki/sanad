import { clsx } from "clsx";
import { RiskBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface RiskScore {
  score: number;
  level: string;
  reasons: string;
  calculatedAt: string;
}

const levelColors: Record<string, string> = {
  SAFE: "text-green-600",
  NORMAL: "text-gray-600",
  EARLY_RISK: "text-blue-600",
  PROBABLE_RISK: "text-amber-600",
  HIGH_RISK: "text-red-600",
};

const levelBg: Record<string, string> = {
  SAFE: "bg-green-50 border-green-200",
  NORMAL: "bg-gray-50 border-gray-200",
  EARLY_RISK: "bg-blue-50 border-blue-200",
  PROBABLE_RISK: "bg-amber-50 border-amber-200",
  HIGH_RISK: "bg-red-50 border-red-200",
};

export function RiskScoreCard({ riskScore }: { riskScore: RiskScore | null }) {
  if (!riskScore) return null;

  let factors: string[] = [];
  try {
    factors = JSON.parse(riskScore.reasons ?? "[]");
  } catch {
    factors = [];
  }

  const color = levelColors[riskScore.level] ?? "text-gray-600";
  const bg = levelBg[riskScore.level] ?? "bg-gray-50 border-gray-200";

  return (
    <Card className={clsx("border", bg)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-navy-900">درجة الخطر الأكاديمي</h3>
        <RiskBadge level={riskScore.level} />
      </div>
      <div className="flex items-end gap-2 mb-4">
        <span className={clsx("text-5xl font-bold", color)}>{riskScore.score}</span>
        <span className="text-gray-400 text-lg mb-1">/100</span>
      </div>
      {/* Score bar */}
      <div className="h-2 rounded-full bg-gray-200 mb-4">
        <div
          className={clsx(
            "h-2 rounded-full transition-all",
            riskScore.score <= 25 ? "bg-green-500" :
            riskScore.score <= 50 ? "bg-gray-500" :
            riskScore.score <= 70 ? "bg-blue-500" :
            riskScore.score <= 85 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${riskScore.score}%` }}
        />
      </div>
      {factors.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">عوامل الخطر:</p>
          <ul className="space-y-1">
            {factors.map((f, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">
        آخر تحديث: {new Date(riskScore.calculatedAt).toLocaleDateString("ar-SA")}
      </p>
    </Card>
  );
}
