import fetch from "node-fetch";
export class EBIGetEntryHandler {
    async run(args) {
        const { domain, entryIds } = args;
        if (!domain || !entryIds) {
            throw new Error("domain and entryIds are required");
        }
        const ids = Array.isArray(entryIds)
            ? entryIds.join(",")
            : entryIds;
        const params = new URLSearchParams({
            format: "json"
        });
        const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(domain)}/entry/${encodeURIComponent(ids)}?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`EBI entry retrieval failed (${res.status})`);
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
        // Preserve EBI entry structure
        const payload = {
            domain,
            count: data.entries.length,
            entries: data.entries.map((e) => ({
                id: String(e.id),
                acc: e.acc,
                source: e.source ?? domain,
                fields: e.fields ?? {},
                score: e.score ?? null
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
//# sourceMappingURL=get_entry.js.map