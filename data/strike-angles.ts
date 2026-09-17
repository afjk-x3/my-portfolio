import type { StrikeAngle } from "@/types";

/*
 * The twelve basic strikes, numbered as commonly taught for sport Arnis anyo
 * and Modern Arnis, from a right-handed striker's point of view. Numbering
 * differs between systems, so every entry stays `confirmed: false` until the
 * owner checks it against their own training.
 */
export const strikeAngles: StrikeAngle[] = [
  { number: 1, target: "Left temple", degrees: 135, confirmed: false },
  { number: 2, target: "Right temple", degrees: 45, confirmed: false },
  { number: 3, target: "Left side of the body", degrees: 180, confirmed: false },
  { number: 4, target: "Right side of the body", degrees: 0, confirmed: false },
  { number: 5, target: "Stomach (thrust)", degrees: null, confirmed: false },
  { number: 6, target: "Left chest (thrust)", degrees: null, confirmed: false },
  { number: 7, target: "Right chest (thrust)", degrees: null, confirmed: false },
  { number: 8, target: "Left knee", degrees: 135, confirmed: false },
  { number: 9, target: "Right knee", degrees: 45, confirmed: false },
  { number: 10, target: "Left eye (thrust)", degrees: null, confirmed: false },
  { number: 11, target: "Right eye (thrust)", degrees: null, confirmed: false },
  { number: 12, target: "Crown of the head", degrees: 90, confirmed: false },
];

/** Looks up a strike by number. Throws on a number outside 1–12. */
export function getStrike(number: number): StrikeAngle {
  const strike = strikeAngles.find((entry) => entry.number === number);
  if (!strike) throw new Error(`Unknown strike angle: ${number}`);
  return strike;
}
