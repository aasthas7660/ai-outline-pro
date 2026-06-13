import type { OutlineContent } from "./outline-types";

export type ExportFormat = "markdown" | "html" | "txt" | "blogger";

export function outlineToHtml(c: OutlineContent): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sections = c.sections
    .map(
      (s) =>
        `  <h2>${esc(s.h2)}</h2>\n  <ul>\n${s.h3
          .map((h) => `    <li>${esc(h)}</li>`)
          .join("\n")}\n  </ul>`,
    )
    .join("\n");
  const faqs = c.faqs
    .map(
      (f) =>
        `  <h3>${esc(f.question)}</h3>\n  <p>${esc(f.answer)}</p>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${esc(c.h1)}</title></head>
<body>
  <h1>${esc(c.h1)}</h1>
  <h2>Introduction</h2>
  <p>${esc(c.introduction)}</p>
${sections}
  <h2>Conclusion</h2>
  <p>${esc(c.conclusion)}</p>
  <h2>Key Takeaways</h2>
  <ul>
${c.key_takeaways.map((k) => `    <li>${esc(k)}</li>`).join("\n")}
  </ul>
  <h2>Related Topics</h2>
  <ul>
${c.related_topics.map((t) => `    <li>${esc(t)}</li>`).join("\n")}
  </ul>
  <h2>FAQs</h2>
${faqs}
</body>
</html>`;
}

export function outlineToBloggerHtml(c: OutlineContent): string {
  // Body-only HTML with inline-friendly markup for Blogger's editor.
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts: string[] = [];
  parts.push(`<h1 style="font-family:Georgia,serif;">${esc(c.h1)}</h1>`);
  parts.push(`<h2>Introduction</h2><p>${esc(c.introduction)}</p>`);
  c.sections.forEach((s) => {
    parts.push(`<h2>${esc(s.h2)}</h2>`);
    parts.push(`<ul>${s.h3.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`);
  });
  parts.push(`<h2>Conclusion</h2><p>${esc(c.conclusion)}</p>`);
  parts.push(
    `<h2>Key Takeaways</h2><ul>${c.key_takeaways
      .map((k) => `<li>${esc(k)}</li>`)
      .join("")}</ul>`,
  );
  parts.push(
    `<h2>Related Topics</h2><ul>${c.related_topics
      .map((t) => `<li>${esc(t)}</li>`)
      .join("")}</ul>`,
  );
  parts.push(`<h2>FAQs</h2>`);
  c.faqs.forEach((f) => {
    parts.push(`<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`);
  });
  return parts.join("\n");
}

export function outlineToTxt(c: OutlineContent): string {
  const lines: string[] = [];
  lines.push(c.h1.toUpperCase(), "=".repeat(c.h1.length), "");
  lines.push("INTRODUCTION", "------------", c.introduction, "");
  c.sections.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.h2}`);
    s.h3.forEach((h) => lines.push(`   - ${h}`));
    lines.push("");
  });
  lines.push("CONCLUSION", "----------", c.conclusion, "");
  lines.push("KEY TAKEAWAYS");
  c.key_takeaways.forEach((k) => lines.push(`  * ${k}`));
  lines.push("", "RELATED TOPICS");
  c.related_topics.forEach((t) => lines.push(`  * ${t}`));
  lines.push("", "FAQS");
  c.faqs.forEach((f) => lines.push(`Q: ${f.question}`, `A: ${f.answer}`, ""));
  return lines.join("\n");
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const FORMAT_META: Record<ExportFormat, { label: string; ext: string; mime: string }> = {
  markdown: { label: "Markdown (.md)", ext: "md", mime: "text/markdown" },
  html: { label: "HTML (.html)", ext: "html", mime: "text/html" },
  txt: { label: "Plain Text (.txt)", ext: "txt", mime: "text/plain" },
  blogger: { label: "Blogger HTML (.html)", ext: "html", mime: "text/html" },
};
