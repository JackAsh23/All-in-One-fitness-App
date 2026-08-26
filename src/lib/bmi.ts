export type BmiCategory = {
  label: string;
  detail: string;
  tone: "low" | "ok" | "warn" | "high";
};

/** WHO adult BMI classification. kg / m², rounded to one decimal. */
export function bodyMassIndex(kg: number, heightCm: number): number | null {
  if (!(kg > 0) || !(heightCm > 0) || !Number.isFinite(kg) || !Number.isFinite(heightCm)) return null;
  const meters = heightCm / 100;
  const bmi = kg / (meters * meters);
  if (!Number.isFinite(bmi)) return null;
  return Math.round(bmi * 10) / 10;
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return { label: "Underweight", detail: "Below the healthy range.", tone: "low" };
  if (bmi < 25) return { label: "Healthy", detail: "In the typical adult range.", tone: "ok" };
  if (bmi < 30) return { label: "Overweight", detail: "Above the healthy range.", tone: "warn" };
  if (bmi < 35) return { label: "Obese (class I)", detail: "Raised health risk.", tone: "high" };
  if (bmi < 40) return { label: "Obese (class II)", detail: "High health risk.", tone: "high" };
  return { label: "Obese (class III)", detail: "Very high health risk.", tone: "high" };
}
