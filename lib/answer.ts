/**
 * Deterministic, dependency-free document answerer.
 *
 * Used when no LLM is configured so the Q&A panels still return something
 * grounded in the document instead of a dead end. It extracts candidate
 * passages by keyword overlap, with a few targeted helpers for the question
 * shapes people actually ask about invoices and reports.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "and", "or",
  "but", "if", "then", "of", "to", "in", "on", "at", "for", "with", "by", "from",
  "as", "that", "this", "these", "those", "it", "its", "they", "them", "their",
  "we", "our", "you", "your", "he", "she", "his", "her", "what", "which", "who",
  "whom", "whose", "when", "where", "why", "how", "do", "does", "did", "can",
  "could", "should", "would", "will", "shall", "may", "might", "must", "not", "no",
  "yes", "there", "here", "any", "all", "some", "each", "every", "about", "into",
  "than", "too", "very", "i", "me", "my", "mine", "us", "him", "so", "up", "out",
  "off", "over", "under", "again", "more", "most", "other", "such", "only", "own",
  "same", "also", "just", "now", "tell", "show", "give", "list", "find", "get",
  "please", "document", "doc", "file", "pdf", "content", "text", "many", "much",
  "done",
]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Very small suffix stripper: billed->bill, dates->date, amounts->amount. */
function stem(w: string): string {
  if (w.length > 6 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 5 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

function keywords(question: string): string[] {
  const raw = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return [...new Set(raw.map(stem))];
}

/**
 * Split markdown into candidate passages: one per line, sentences for long
 * ones. Extracted documents often put a label and its value on separate lines
 * ("Invoice Number:" / "INV-001"), so a label ending in ":" absorbs the next
 * line to keep the pair together.
 */
function passages(markdown: string): string[] {
  // Nutrient emits HTML tables for tabular documents; collapse each row into
  // a single line so "Total Due" and its value stay together.
  const normalized = markdown
    .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_m, row: string) => {
      const cells = row
        .split(/<\/t[dh]>/i)
        .map((c) => c.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      return `\n${cells.join(" — ")}\n`;
    })
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");

  const lines = normalized
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/:\s*$/.test(line) && i + 1 < lines.length && !/^[#>\-*]/.test(lines[i + 1])) {
      line = `${line} ${lines[i + 1]}`;
      i++;
    }
    merged.push(line);
  }

  const out: string[] = [];
  for (const line of merged) {
    if (line.startsWith("#") || line.length <= 220) {
      out.push(line);
      continue;
    }
    for (const sentence of line.split(/(?<=[.!?])\s+/)) {
      const s = sentence.trim();
      if (s) out.push(s);
    }
  }
  return out;
}

function score(passage: string, kws: string[]): number {
  const hay = passage.toLowerCase();
  let total = 0;
  for (const kw of kws) {
    const matches = hay.match(new RegExp(`\\b${escapeRegExp(kw)}\\w*\\b`, "gi"));
    if (matches) total += matches.length;
  }
  return total;
}

// Non-global forms are used with `.test()`: a global regex carries `lastIndex`
// across calls, which made answers alternate between correct and wrong.
const CURRENCY = /[$€£]\s?\d[\d,]*(?:\.\d{1,2})?/;
const DATE =
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i;

function allMatches(pattern: string, source: string): string[] {
  return source.match(new RegExp(pattern, "g")) || [];
}

function countMatches(markdown: string, terms: string[]): number {
  const hay = markdown.toLowerCase();
  let n = 0;
  for (const term of terms) {
    const words = term
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) continue;
    const pattern = words
      .map((w) => `\\b${escapeRegExp(stem(w))}\\w*\\b`)
      .join("\\s+");
    n += (hay.match(new RegExp(pattern, "gi")) || []).length;
  }
  return n;
}

/** How specifically a line names a total-like figure (higher = more specific). */
const TOTAL_PATTERNS: { re: RegExp; score: number }[] = [
  { re: /\b(total due|amount due|balance due|total payable|grand total)\b/i, score: 6 },
  { re: /\btotal\b/i, score: 5 },
  { re: /\bsubtotal\b/i, score: 4 },
  { re: /\b(net total|net)\b/i, score: 3 },
  { re: /\b(tax|vat|gst)\b/i, score: 2 },
  { re: /\b(rate|price|cost|amount|sum|charge|fee)\b/i, score: 1 },
];

function totalScore(passage: string): number {
  let best = 0;
  for (const { re, score } of TOTAL_PATTERNS) {
    if (re.test(passage)) best = Math.max(best, score);
  }
  return best;
}

function quote(passage: string): string {
  return passage
    .split("\n")
    .map((l) => `> ${l}`.trimEnd())
    .join("\n");
}

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const key = x.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Capitalised name phrases, e.g. "Northwind Traders", "Dana Whitfield". */
function names(markdown: string): string[] {
  return unique(markdown.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []);
}

/**
 * Answer a question from the document using deterministic extraction.
 * Always grounded in the supplied content; never invents an answer.
 */
export function answerFromDocument(question: string, markdown: string): string {
  const kws = keywords(question);
  const q = question.toLowerCase();
  const candidates = passages(markdown);

  // "how many X" -> count occurrences of X in the document.
  const howMany = q.match(/^how many\s+(.+)/);
  if (howMany) {
    const words = howMany[1]
      .replace(/[?.!]+$/, "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    // Drop trailing verb forms ("how many items are listed" -> "items").
    while (words.length && /(ed|ing)$/.test(words[words.length - 1])) words.pop();
    const phrase = words.join(" ");
    const n = phrase ? countMatches(markdown, [phrase]) : 0;
    if (n > 0) {
      return `The document contains **${n}** mention${n === 1 ? "" : "s"} of “${phrase}”.`;
    }
  }

  // "total / amount / due / subtotal / tax" -> prefer the line that actually
  // states the requested figure, most specific first.
  if (/\b(total|amount|sum|due|balance|price|cost|payable|subtotal|tax|vat)\b/.test(q)) {
    const wantSubtotal = /\bsubtotal\b/.test(q);
    const wantTax = /\b(tax|vat|gst)\b/.test(q);
    const ranked = candidates
      .filter((p) => CURRENCY.test(p))
      .map((p) => {
        let s = totalScore(p);
        const lower = p.toLowerCase();
        if (wantSubtotal && /\bsubtotal\b/i.test(lower)) s += 10;
        if (wantTax && /\b(tax|vat|gst)\b/i.test(lower)) s += 10;
        return { p, s };
      })
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);

    const picked = unique(ranked.slice(0, 2).map((r) => r.p));
    if (picked.length) {
      return `From the document:\n\n${picked.map(quote).join("\n\n")}`;
    }
    const values = unique(allMatches(CURRENCY.source, markdown));
    if (values.length) {
      return `Monetary values found in the document: ${values.join(", ")}.`;
    }
  }

  // "when / date" -> dated lines.
  if (/\b(when|date|dated|deadline|due date|issued|expiration)\b/.test(q)) {
    const dated = candidates.filter((p) => DATE.test(p));
    if (dated.length) {
      return `Dates found in the document:\n\n${dated.map(quote).join("\n\n")}`;
    }
  }

  // "who / billed to / contact" -> named parties in the document.
  if (/\b(who|whom|billed to|bill to|attn|contact|customer|client)\b/.test(q)) {
    const named = candidates.filter((p) => /\b(bill to|attn|customer|client|from)\b/i.test(p));
    if (named.length) {
      return `Named in the document:\n\n${named.map(quote).join("\n\n")}`;
    }
    const people = names(markdown).slice(0, 5);
    if (people.length) {
      return `Names appearing in the document: ${people.join(", ")}.`;
    }
  }

  // General case: rank passages by keyword overlap.
  if (kws.length) {
    const ranked = candidates
      .map((p) => ({ p, s: score(p, kws) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((r) => r.p);

    if (ranked.length) {
      return `The document says:\n\n${ranked.map(quote).join("\n\n")}`;
    }
  }

  return (
    "I could not find that in the document. The answer may be worded differently, " +
    "or it may not be present at all — this search only looks at the extracted text."
  );
}
