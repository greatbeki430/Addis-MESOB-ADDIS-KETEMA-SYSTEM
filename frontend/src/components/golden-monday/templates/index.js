// frontend/src/components/golden-monday/templates/index.js
//
// Central registry of available poster templates. To add a new one:
//   1. Create a new file in this folder exporting `meta` and `render`.
//   2. Import it below.
//   3. Add it to the TEMPLATES object and TEMPLATE_ORDER array.
// The Poster Studio UI picks it up automatically.

import * as ClassicBlue from "./ClassicBlue";
import * as ModernMinimal from "./ModernMinimal";
import * as ElegantGold from "./ElegantGold";
import * as Geometric from "./Geometric";
import * as CeremonialRed from "./CeremonialRed";

export const TEMPLATES = {
  [ClassicBlue.meta.id]: ClassicBlue,
  [ModernMinimal.meta.id]: ModernMinimal,
  [ElegantGold.meta.id]: ElegantGold,
  [Geometric.meta.id]: Geometric,
  [CeremonialRed.meta.id]: CeremonialRed,
};

// Ordered list for the picker UI. Order here = display order.
// CeremonialRed is placed between ElegantGold and Geometric so the
// warm-tone designs (ElegantGold, CeremonialRed) sit together in
// the picker, followed by the bolder Geometric layout.
export const TEMPLATE_ORDER = [
  ClassicBlue.meta.id,
  ModernMinimal.meta.id,
  ElegantGold.meta.id,
  CeremonialRed.meta.id,
  Geometric.meta.id,
];

// Default template when the coordinator opens the studio.
export const DEFAULT_TEMPLATE = ClassicBlue.meta.id;
