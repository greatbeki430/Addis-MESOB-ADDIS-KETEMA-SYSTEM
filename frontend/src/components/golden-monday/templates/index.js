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
import * as StudioTemplate from "./StudioTemplate";

export const TEMPLATES = {
  [ClassicBlue.meta.id]: ClassicBlue,
  [ModernMinimal.meta.id]: ModernMinimal,
  [ElegantGold.meta.id]: ElegantGold,
  [Geometric.meta.id]: Geometric,
  [CeremonialRed.meta.id]: CeremonialRed,
  [StudioTemplate.meta.id]: StudioTemplate,
};

// Ordered list for the picker UI. Order here = display order.
//
//   · ClassicBlue   — the original committee look
//   · ModernMinimal — clean editorial
//   · ElegantGold   — formal navy + gold
//   · CeremonialRed — deep burgundy, ceremonial
//   · Geometric     — bold flat-color blocks
//   · Studio        — drag-and-drop with colour themes (last, it's
//                     the most interactive and worth discovering)
//
export const TEMPLATE_ORDER = [
  ClassicBlue.meta.id,
  ModernMinimal.meta.id,
  ElegantGold.meta.id,
  CeremonialRed.meta.id,
  Geometric.meta.id,
  StudioTemplate.meta.id,
];

// Default template when the coordinator opens the studio.
export const DEFAULT_TEMPLATE = ClassicBlue.meta.id;

// Re-export the default Studio layout so PosterStudio.jsx can pull it
// via a single import from "./templates" without reaching into the
// template file directly.
export { DEFAULT_STUDIO_LAYOUT } from "./StudioTemplate";
