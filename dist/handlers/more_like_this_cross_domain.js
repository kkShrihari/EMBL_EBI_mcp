import fetch from "node-fetch";
export class EBIMoreLikeThisCrossDomainHandler {
    async run(args) {
        const { domain, entryId, targetDomain, size = 10 } = args;
        if (!domain || !entryId || !targetDomain) {
            throw new Error("domain, entryId, and targetDomain are required");
        }
        const params = new URLSearchParams({
            size: String(size),
            format: "json"
        });
        const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(domain)}/entry/${encodeURIComponent(entryId)}/morelikethis/${encodeURIComponent(targetDomain)}?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`EBI more-like-this (cross domain) failed (${res.status})`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            const text = await res.text();
            throw new Error("EBI Search returned non-JSON response: " + text.slice(0, 200));
        }
        const data = await res.json();
        if (!Array.isArray(data.entries)) {
            throw new Error("Unexpected API response format: entries not found");
        }
        const payload = {
            sourceDomain: domain,
            sourceId: entryId,
            targetDomain,
            count: data.entries.length,
            relatedEntries: data.entries.map((e) => ({
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
//# sourceMappingURL=more_like_this_cross_domain.js.map