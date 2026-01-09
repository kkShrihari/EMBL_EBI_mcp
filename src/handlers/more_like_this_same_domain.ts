import fetch from "node-fetch";

export class EBIMoreLikeThisSameDomainHandler {
  async run(args: {
    domain: string;
    entryId: string;
    size?: number;
  }) {
    const { domain, entryId, size = 10 } = args;

    if (!domain || !entryId) {
      throw new Error("domain and entryId are required");
    }

    const params = new URLSearchParams({
      size: String(size),
      format: "json"
    });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(
      domain
    )}/entry/${encodeURIComponent(entryId)}/morelikethis?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `EBI more-like-this (same domain) failed (${res.status})`
      );
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
      throw new Error(
        "Unexpected API response format: entries not found"
      );
    }

    const payload = {
      domain,
      sourceId: entryId,
      count: data.entries.length,
      similarEntries: data.entries.map((e: any) => ({
        id: String(e.id),
        score: e.score ?? null,
        fields: e.fields ?? {}
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
