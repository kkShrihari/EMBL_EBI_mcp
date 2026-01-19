import fetch from "node-fetch";

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 6;

export class EBIMoreLikeThisCrossDomainHandler {
  async run(args: {
    domain: string;
    entryId: string;
    targetDomain: string;
    size?: number;
  }) {
    const {
      domain,
      entryId,
      targetDomain,
      size = DEFAULT_LIMIT
    } = args;

    if (!domain || !entryId || !targetDomain) {
      throw new Error("domain, entryId, and targetDomain are required");
    }

    const limit = Math.min(size, MAX_LIMIT);

    const params = new URLSearchParams({
      size: String(limit),
      format: "json"
    });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(
      domain
    )}/entry/${encodeURIComponent(
      entryId
    )}/morelikethis/${encodeURIComponent(
      targetDomain
    )}?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `EBI more-like-this (cross domain) failed (${res.status})`
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

    // 🔹 Empty → minimal payload
    if (hitCount === 0 || entries.length === 0) {
      return {
        structuredContent: {
          sourceDomain: domain,
          sourceId: entryId,
          targetDomain
        }
      };
    }

    // 🔹 Limited entries, IDs only
    const relatedEntries = entries
      .slice(0, limit)
      .map((e: any) => ({
        id: String(e.id)
      }));

    const payload = {
      sourceDomain: domain,
      sourceId: entryId,
      targetDomain,
      count: hitCount,             
      relatedEntries               
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
