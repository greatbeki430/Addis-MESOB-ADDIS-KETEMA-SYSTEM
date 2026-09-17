// frontend/src/components/golden-monday/templates/index.js
//
// Central registry of available poster templates. To add a new one:
//   1. Create a new file in this folder exporting `meta` and `render`.
//   2. Import it below.
//   3. Add it to the TEMPLATES object.
// The Poster Studio UI picks it up automatically.

import * as ClassicBlue from "./ClassicBlue";
import * as ModernMinimal from "./ModernMinimal";
import * as ElegantGold from "./ElegantGold";
import * as Geometric from "./Geometric";

export const TEMPLATES = {
  [ClassicBlue.meta.id]: ClassicBlue,
  [ModernMinimal.meta.id]: ModernMinimal,
  [ElegantGold.meta.id]: ElegantGold,
  [Geometric.meta.id]: Geometric,
};

// Ordered list for the picker UI. Order here = display order.
export const TEMPLATE_ORDER = [
  ClassicBlue.meta.id,
  ModernMinimal.meta.id,
  ElegantGold.meta.id,
  Geometric.meta.id,
];

// Default template when the coordinator opens the studio.
export const DEFAULT_TEMPLATE = ClassicBlue.meta.id;
