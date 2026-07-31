// backend/src/constants/goldenMondayCategories.js
// The six categories that always exist, regardless of what's in the
// GoldenMondayCategory collection. Any category slug not in this list
// must exist as a row in GoldenMondayCategory to be considered valid.

const BUILT_IN_CATEGORIES = [
  "flag-raising",
  "presentation",
  "group-photo",
  "attendees",
  "event",
  "other",
];

// Below this AI confidence in the best-matching existing category
// (built-in or dynamic), the categorizer proposes a brand-new category
// instead of forcing a weak match. Tune this after watching real
// categorization results — it's a starting point, not a measured value.
const NEW_CATEGORY_CONFIDENCE_THRESHOLD = 0.75;

module.exports = { BUILT_IN_CATEGORIES, NEW_CATEGORY_CONFIDENCE_THRESHOLD };
