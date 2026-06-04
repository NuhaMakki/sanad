export type PriorityParams = {
  isGraduating: boolean;
  warningCount: number;
  riskLevel: string;
  locationType: string;
  issuePriority: string;
};

export function calculatePriorityScore(params: PriorityParams): number {
  let score = 50;

  if (params.isGraduating) score += 20;

  if (params.riskLevel === "HIGH_RISK") score += 25;
  else if (params.riskLevel === "PROBABLE_RISK") score += 15;
  else if (params.riskLevel === "EARLY_RISK") score += 5;

  if (params.warningCount >= 3) score += 10;

  if (params.locationType === "ONCAMPUS") score += 5;

  if (params.issuePriority === "HIGH") score += 10;

  return score;
}
