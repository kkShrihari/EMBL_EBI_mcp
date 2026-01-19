import fetch from "node-fetch";

export class EBISearchDomainHandler {
  async run(args: {
    domain: string;
    query: string;
    size?: number;
    start?: number;
  }) {
    const { domain, query, size = 10, start = 0 } = args;

    if (!domain || !query) {
      throw new Error("domain and query are required");
    }

    const params = new URLSearchParams({
      query,
      size: String(size),
      start: String(start),
      format: "json"
    });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(
      domain
    )}?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`EBI Search domain failed (${res.status})`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "EBI Search returned non-JSON response: " + text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    if (!Array.isArray(data.entries)) {
      throw new Error("Unexpected API response format: entries not found");
    }

    // Preserve EBI entry structure, lightly normalized
    const payload = {
      domain,
      query,
      hitCount: data.hitCount ?? data.entries.length,
      entries: data.entries.map((e: any) => ({
        id: String(e.id),
        acc: e.acc,
        source: e.source ?? domain,
        ...(e.fields && Object.keys(e.fields).length > 0
          ? { fields: e.fields }
          : {})
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
