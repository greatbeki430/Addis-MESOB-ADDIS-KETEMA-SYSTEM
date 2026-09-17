// src/components/golden-monday/GoldenMondayRotationPanel.jsx
//
// Thin wrapper that re-exports the refactored rotation panel.
// The real implementation lives in ./rotation/. Keeping this file
// means every existing import of GoldenMondayRotationPanel keeps
// working without touching the parent page.

import RotationPanel from "./rotation/RotationPanel";

export default RotationPanel;
