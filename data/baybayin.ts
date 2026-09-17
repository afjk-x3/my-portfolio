import type { BaybayinEntry } from "@/types";

/*
 * Every baybayin string on the site lives here. Characters are written as
 * Unicode escapes so that no editor, font, or copy-paste can silently change
 * them. Conventions used:
 *
 * - Modern orthography with the krus-kudlit (U+1714) cancelling a final vowel.
 * - The letter DA (U+1707) also writes RA, as in pre-colonial usage.
 * - Z has no letter and is written with SA (U+1710).
 *
 * None of these have been checked by a baybayin reader yet. Do not flip
 * `reviewed` to `true` without one.
 */
export const baybayin = {
  name: {
    text: "\u1704\u1707\u1710",
    latin: "Garaza",
    meaning: "The owner's surname",
    reviewed: false,
  },
  motto: {
    text: "\u1710\u1712\u1709\u1704\u1714 \u1700\u1706\u1714 \u1707\u1712\u1710\u1712\u1709\u1714\u170E\u1712\u1708",
    latin: "Sipag at Disiplina",
    meaning: "Diligence and discipline",
    reviewed: false,
  },
  projects: {
    text: "\u1709\u1714\u1707\u1713\u170C\u1712\u1703\u1714\u1706\u1713",
    latin: "Proyekto",
    meaning: "Project",
    reviewed: false,
  },
  stack: {
    text: "\u1703\u1710\u1708\u170C\u1708\u1714",
    latin: "Kasanayan",
    meaning: "Skills",
    reviewed: false,
  },
  contact: {
    text: "\u1702\u1704\u1714\u1708\u170C\u1708\u1714",
    latin: "Ugnayan",
    meaning: "Connection, contact",
    reviewed: false,
  },
} satisfies Record<string, BaybayinEntry>;
