// backend/src/services/galleryImageCategorizationService.js
// Extracted verbatim from goldenMondayController.js's analyzeAndCategorizePhoto
// so it can be called both by the standalone POST /gallery/analyze endpoint
// (unchanged behavior) and by the new bulk multi-file upload route.

const { analyzeDocumentImage } = require("./aiService");

const KEYWORD_SETS = {
  "flag-raising": [
    "flag",
    "ባንዲራ",
    "ethiopian flag",
    "ኢትዮጵያ ባንዲራ",
    "flag raising",
    "ባንዲራ ማንሳት",
    "national flag",
    "ብሔራዊ ባንዲራ",
    "flag ceremony",
    "ባንዲራ ሥነ ሥርዓት",
    "flagpole",
    "ባንዲራ ምሰሶ",
    "flags",
    "ባንዲራዎች",
    "ethiopian national flag",
    "የኢትዮጵያ ብሔራዊ ባንዲራ",
    "flag raising ceremony",
    "ባንዲራ ማንሳት ሥነ ሥርዓት",
    "green yellow red",
    "ቢጫ ቀይ አረንጓዴ",
    "flag bearer",
    "ባንዲራ ተሸካሚ",
  ],
  presentation: [
    "presentation",
    "ዝግጅት",
    "presenter",
    "አቅራቢ",
    "slide",
    "ስላይድ",
    "powerpoint",
    "power point",
    "ppt",
    "speaker",
    "ተናጋሪ",
    "presenting",
    "በማቅረብ",
    "presented",
    "አቅርቧል",
    "keynote",
    "lecture",
    "ትምህርት",
    "speaking",
    "ማውራት",
    "talk",
    "ንግግር",
    "presentation skills",
    "public speaking",
    "ህዝባዊ ንግግር",
    "presentation material",
    "የዝግጅት ቁሳቁስ",
    "presenter on stage",
    "መድረክ ላይ አቅራቢ",
    "presentation screen",
    "የዝግጅት ማያ",
    "presentation slides",
    "የዝግጅት ስላይዶች",
  ],
  "group-photo": [
    "group",
    "ቡድን",
    "team",
    "group photo",
    "የቡድን ፎቶ",
    "group picture",
    "የቡድን ምስል",
    "staff photo",
    "የሰራተኛ ፎቶ",
    "team photo",
    "group of people",
    "የሰዎች ቡድን",
    "group shot",
    "together",
    "አብረው",
    "group portrait",
    "የቡድን ሥዕል",
    "multiple people",
    "ብዙ ሰዎች",
    "crowd",
    "ህዝብ",
    "gathering",
    "መሰብሰብ",
    "team building",
    "ቡድን መገንባት",
    "group of employees",
    "የሰራተኞች ቡድን",
    "staff group",
    "የሰራተኛ ቡድን",
  ],
  attendees: [
    "attendee",
    "ተሳታፊ",
    "audience",
    "ተመልካች",
    "participant",
    "attendees",
    "ተሳታፊዎች",
    "people",
    "ሰዎች",
    "crowd",
    "ህዝብ",
    "auditorium",
    "አዳራሽ",
    "seated",
    "ተቀምጧል",
    "viewers",
    "ተመልካቾች",
    "spectators",
    "listeners",
    "አድማጮች",
    "attendance",
    "መገኘት",
    "participating",
    "በመሳተፍ",
    "people sitting",
    "የተቀመጡ ሰዎች",
    "people watching",
    "የሚመለከቱ ሰዎች",
    "audience seating",
    "የተመልካች መቀመጫ",
    "filled seats",
    "የተሞሉ መቀመጫዎች",
    "people in audience",
    "በተመልካች ውስጥ ያሉ ሰዎች",
  ],
  event: [
    "event",
    "ዝግጅት",
    "ceremony",
    "ሥነ ሥርዓት",
    "celebration",
    "ክብረ በዓል",
    "award",
    "ሽልማት",
    "gathering",
    "መሰብሰብ",
    "festival",
    "በዓል",
    "conference",
    "ጉባኤ",
    "seminar",
    "ሴሚናር",
    "workshop",
    "ዎርክሾፕ",
    "meeting",
    "ስብሰባ",
    "summit",
    "forum",
    "መድረክ",
    "symposium",
    "ሲምፖዚየም",
    "expo",
    "ኤክስፖ",
    "exhibition",
    "ኤክስቢሽን",
    "graduation",
    "ምረቃ",
    "opening ceremony",
    "የመክፈቻ ሥነ ሥርዓት",
    "closing ceremony",
    "የመዝጊያ ሥነ ሥርዓት",
    "special event",
    "ልዩ ዝግጅት",
    "official event",
    "ኦፊሴላዊ ዝግጅት",
    "ceremonial",
    "ሥነ ሥርዓታዊ",
    "event hall",
    "የዝግጅት አዳራሽ",
    "event venue",
    "የዝግጅት ቦታ",
  ],
};

const DOCUMENT_TYPE_MAP = {
  birth_certificate: "event",
  death_certificate: "event",
  marriage_certificate: "event",
  divorce_certificate: "event",
  residence_id: "attendees",
  name_change: "attendees",
  presentation: "presentation",
  group_photo: "group-photo",
  flag_raising: "flag-raising",
  attendees: "attendees",
  event: "event",
  certificate: "event",
  id_card: "attendees",
  license: "attendees",
};

const CATEGORY_RELATIONS = {
  "flag-raising": ["event", "attendees", "group-photo"],
  presentation: ["attendees", "event", "group-photo"],
  "group-photo": ["attendees", "event", "presentation"],
  attendees: ["event", "presentation", "group-photo"],
  event: ["attendees", "presentation", "group-photo"],
};

/**
 * Core categorization logic — same behavior as the original inline code
 * in analyzeAndCategorizePhoto, just returning a plain object instead of
 * writing an HTTP response.
 */
const categorizeImage = async (base64Data, mimeType) => {
  const analysis = await analyzeDocumentImage(base64Data, mimeType);

  let detectedCategory = "other";
  let confidence = 0.5;
  const matchedKeywords = [];

  const fullText = [
    analysis.title || "",
    analysis.notes || "",
    analysis.citizenName || "",
    analysis.citizenNameAmharic || "",
    analysis.issuingDepartment || "",
    (analysis.tags || []).join(" "),
    analysis.documentType || "",
  ]
    .join(" ")
    .toLowerCase();
  const title = (analysis.title || "").toLowerCase();
  const notes = (analysis.notes || "").toLowerCase();

  for (const [cat, keywords] of Object.entries(KEYWORD_SETS)) {
    if (detectedCategory !== "other") break;
    for (const keyword of keywords) {
      if (
        fullText.includes(keyword) ||
        title.includes(keyword) ||
        notes.includes(keyword)
      ) {
        matchedKeywords.push(keyword);
        detectedCategory = cat;
        confidence = Math.max(
          confidence,
          cat === "flag-raising"
            ? 0.85
            : cat === "group-photo"
              ? 0.8
              : cat === "attendees"
                ? 0.78
                : 0.82,
        );
        break;
      }
    }
  }

  if (
    detectedCategory === "other" &&
    analysis.documentType &&
    DOCUMENT_TYPE_MAP[analysis.documentType]
  ) {
    detectedCategory = DOCUMENT_TYPE_MAP[analysis.documentType];
    confidence = analysis.confidence === "high" ? 0.85 : 0.6;
    matchedKeywords.push(`document_type: ${analysis.documentType}`);
  }

  if (analysis.confidence === "high") confidence = Math.max(confidence, 0.8);
  else if (analysis.confidence === "medium")
    confidence = Math.max(confidence, 0.65);
  if (detectedCategory !== "other" && confidence < 0.6) confidence = 0.7;

  const suggestedCategories =
    detectedCategory !== "other"
      ? CATEGORY_RELATIONS[detectedCategory] || ["other"]
      : ["event", "attendees", "presentation", "group-photo", "flag-raising"];

  return {
    category: detectedCategory,
    confidence: Math.round(confidence * 100) / 100,
    matchedKeywords: matchedKeywords.slice(0, 5),
    suggestedCategories: suggestedCategories.slice(0, 3),
    analysis: {
      title: analysis.title || "",
      notes: analysis.notes || "",
      documentType: analysis.documentType || "other",
      citizenName: analysis.citizenName || "",
      tags: analysis.tags || [],
      issuingDepartment: analysis.issuingDepartment || "",
      nationalId: analysis.nationalId || "",
    },
  };
};

module.exports = { categorizeImage };
