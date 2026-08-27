export type SamplePlate = {
  name: string;
  items: { foodId: string; grams: number }[];
};

/** Curated meals for trying the logger — not photo recognition. */
export const SAMPLE_PLATES: SamplePlate[] = [
  {
    name: "Chicken rice bowl",
    items: [
      { foodId: "rice", grams: 200 },
      { foodId: "chicken-breast", grams: 150 },
      { foodId: "egg", grams: 100 },
    ],
  },
  {
    name: "Adobo plate",
    items: [
      { foodId: "adobo", grams: 180 },
      { foodId: "rice", grams: 180 },
    ],
  },
  {
    name: "Breakfast silog",
    items: [
      { foodId: "garlic-rice", grams: 150 },
      { foodId: "egg", grams: 100 },
      { foodId: "tocino", grams: 120 },
    ],
  },
];
