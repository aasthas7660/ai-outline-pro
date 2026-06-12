export type OutlineSection = {
  h2: string;
  h3: string[];
};

export type OutlineContent = {
  h1: string;
  introduction: string;
  sections: OutlineSection[];
  conclusion: string;
  key_takeaways: string[];
  related_topics: string[];
  faqs: { question: string; answer: string }[];
};

export const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Hindi", "Japanese"];
export const TONES = ["Professional", "Casual", "Friendly", "Authoritative", "Witty", "Inspirational", "Technical"];
export const AUDIENCES = ["General", "Beginners", "Intermediate", "Experts", "Marketers", "Developers", "Founders", "Students"];
export const LENGTHS = ["Short", "Medium", "Long", "In-depth"];
