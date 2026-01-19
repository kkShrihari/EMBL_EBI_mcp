import fetch from "node-fetch";

const DEFAULT_MIN = 3;
const MAX_RESULTS = DEFAULT_MIN + 3; // 6

export class EBIMoreLikeThisSameDomainHandler {
  async run(args: {
    domain: string;
    entryId: string;
    size?: number;
  }) {
    const { domain, entryId } = args;

    if (!domain || !entryId) {
      throw new Error("domain and entryId are required");
    }

    // Always ask EBI for enough results, we will trim ourselves
    const params = new URLSearchParams({
      size: String(MAX_RESULTS),
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

    const hitCount = Number(data.hitCount ?? 0);
    const entries = Array.isArray(data.entries) ? data.entries : [];

    // --------------------------------------------------
    // NO RESULTS → CLEAN, MINIMAL PAYLOAD
    // --------------------------------------------------
    if (hitCount === 0 || entries.length === 0) {
      return {
        structuredContent: {
          domain,
          sourceId: entryId
        }
      };
    }

    // --------------------------------------------------
    // LIMIT RESULTS (min 3, max 6)
    // --------------------------------------------------
    const limitedEntries = entries
      .slice(0, MAX_RESULTS)
      .map((e: any) => ({
        id: String(e.id)
      }));

    const payload = {
      domain,
      sourceId: entryId,
      count: hitCount,               // MUST match EBI hitCount
      similarEntries: limitedEntries
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
