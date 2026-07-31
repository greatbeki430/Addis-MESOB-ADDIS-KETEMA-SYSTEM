// backend/src/services/galleryCategorizationService.js
// Resolves a final gallery category (built-in or dynamic) from raw AI
// output, and creates new GoldenMondayCategory rows when the AI's
// confidence in every existing category is below threshold.
//
// This is deliberately separate from aiService.js: aiService.js only
// knows how to talk to providers, it has no idea what categories exist
// in this database.

const GoldenMondayCategory = require("../models/GoldenMondayCategory");
const {
  BUILT_IN_CATEGORIES,
  NEW_CATEGORY_CONFIDENCE_THRESHOLD,
} = require("../constants/goldenMondayCategories");

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

// Returns the full list of currently-valid category slugs: the six
// built-ins plus whatever's been added to GoldenMondayCategory so far.
const listAllCategorySlugs = async () => {
  const dynamic = await GoldenMondayCategory.find().select("slug name");
  return {
    slugs: [...BUILT_IN_CATEGORIES, ...dynamic.map((d) => d.slug)],
    dynamic,
  };
};

/**
 * @param {object} params
 * @param {string} params.candidateCategory - what the AI/keyword-matcher
 *   thinks the category is (may be a built-in slug, an existing dynamic
 *   slug, or a brand-new name the AI proposed).
 * @param {number} params.confidence - 0-1
 * @param {string} params.candidateNewCategoryName - if the AI explicitly
 *   proposed a new category name distinct from candidateCategory (used by
 *   the text-based PDF/doc path; the image path can omit this).
 * @returns {{ category: string, categorySource: "ai"|"default", categoryConfidence: number, createdNewCategory: boolean }}
 */
const resolveGalleryCategory = async ({
  candidateCategory,
  confidence,
  candidateNewCategoryName = "",
}) => {
  const { slugs } = await listAllCategorySlugs();
  const candidateSlug = candidateCategory ? slugify(candidateCategory) : "";

  // Confident AND matches something that already exists (built-in or
  // previously-created dynamic category) → just use it.
  if (
    confidence >= NEW_CATEGORY_CONFIDENCE_THRESHOLD &&
    slugs.includes(candidateSlug)
  ) {
    return {
      category: candidateSlug,
      categorySource: "ai",
      categoryConfidence: confidence,
      createdNewCategory: false,
    };
  }

  // Below threshold, OR the AI's best guess doesn't match anything that
  // exists yet → propose (and create) a new category, provided the AI
  // actually gave us a distinct name to create. Otherwise fall back.
  const newName = (candidateNewCategoryName || candidateCategory || "").trim();
  const newSlug = newName ? slugify(newName) : "";

  if (newSlug && !slugs.includes(newSlug)) {
    try {
      const created = await GoldenMondayCategory.create({
        name: newName,
        slug: newSlug,
        source: "ai",
        confidence,
        createdBy: null,
        createdByName: "AI",
      });
      console.log(
        `[galleryCategorization] 🆕 AI created new category "${created.name}" (${created.slug}), confidence ${confidence}`,
      );
      return {
        category: created.slug,
        categorySource: "ai",
        categoryConfidence: confidence,
        createdNewCategory: true,
      };
    } catch (err) {
      // Unique-index race: another upload created the same slug a moment
      // ago. Just use it rather than erroring the whole upload out.
      if (err.code === 11000) {
        return {
          category: newSlug,
          categorySource: "ai",
          categoryConfidence: confidence,
          createdNewCategory: false,
        };
      }
      console.error(
        "[galleryCategorization] Failed to create new category, falling back to 'other':",
        err.message,
      );
    }
  }

  return {
    category: "other",
    categorySource: confidence > 0 ? "ai" : "default",
    categoryConfidence: confidence,
    createdNewCategory: false,
  };
};

module.exports = { resolveGalleryCategory, listAllCategorySlugs, slugify };
