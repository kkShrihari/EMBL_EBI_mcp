import fetch from "node-fetch";

export class EBISearchAllHandler {
  async run(args: {
    query: string;
    size?: number;
    start?: number;
  }) {
    const { query, size = 10, start = 0 } = args;

    if (!query) {
      throw new Error("query is required");
    }

    const params = new URLSearchParams({
      query,
      size: String(size),
      start: String(start),
      format: "json"
    });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`EBI Search failed (${res.status})`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "EBI Search returned non-JSON response: " + text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    if (!data.entries && !data.domains) {
      throw new Error("Unexpected API response format");
    }

    // Normalize response for Claude + MCP
    const payload = {
      query,
      hitCount: data.hitCount ?? null,
      domains: (data.domains ?? []).map((d: any) => ({
        domain: d.id,
        hitCount: d.hitCount
      }))
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
