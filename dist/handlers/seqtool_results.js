import fetch from "node-fetch";
export class EBISeqToolResultsSearchHandler {
    async run(args) {
        const { query, size = 10, start = 0 } = args;
        if (!query) {
            throw new Error("query (sequence tool job ID) is required");
        }
        const params = new URLSearchParams({
            query,
            size: String(size),
            start: String(start),
            format: "json"
        });
        // NOTE: seqtoolresults is NOT domain-based
        const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/seqtoolresults?${params.toString()}`;
        const res = await fetch(url);
        //  graceful handling (job pending / expired / private)
        if (res.status === 400 || res.status === 404) {
            const payload = {
                query,
                hitCount: 0,
                results: []
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
        if (!res.ok) {
            throw new Error(`EBI sequence tool results search failed (${res.status})`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            const text = await res.text();
            throw new Error("EBI Search returned non-JSON response: " + text.slice(0, 200));
        }
        const data = await res.json();
        const entries = Array.isArray(data.entries) ? data.entries : [];
        const payload = {
            query,
            hitCount: data.hitCount ?? entries.length,
            results: entries.map((e) => ({
                id: String(e.id),
                tool: e.tool ?? null,
                source: e.source ?? null,
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
//# sourceMappingURL=seqtool_results.js.map