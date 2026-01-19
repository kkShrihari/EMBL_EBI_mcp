import fetch from "node-fetch";

const DEFAULT_SIZE = 10;
const MAX_SIZE = 15;

export class EBISummarySuggestionsHandler {
  async run(args: { term: string; size?: number }) {
    const { term, size = DEFAULT_SIZE } = args;

    if (!term) {
      throw new Error("term is required");
    }

    const limit = Math.min(size, MAX_SIZE);

    const url =
      "https://www.ebi.ac.uk/ebisearch/summary/api/suggestion?" +
      new URLSearchParams({
        term,
        size: String(limit)
      }).toString();

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `EBI summary suggestion failed (${res.status})`
      );
    }

    const data: any = await res.json();

    if (!Array.isArray(data.suggestions)) {
      throw new Error(
        "Unexpected API response format: suggestions not found"
      );
    }

    const payload = {
      term,
      suggestions: data.suggestions.slice(0, MAX_SIZE)
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2) + "\n"
        }
      ],
      structuredContent: payload
    };
  }
}
