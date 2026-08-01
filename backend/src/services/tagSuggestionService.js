// backend/src/services/tagSuggestionService.js

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "as",
  "at",
  "by",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "i",
  "we",
  "you",
  "they",
  "my",
  "our",
  "your",
  "their",
  "not",
  "no",
  "so",
  "if",
  "than",
  "then",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "can",
  "could",
  "should",
  "about",
  "into",
  "from",
  "up",
  "out",
  "more",
  "very",
  "just",
]);

async function suggestTagsFromText(text, limit = 5) {
  if (!text || typeof text !== "string") return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

module.exports = { suggestTagsFromText };
