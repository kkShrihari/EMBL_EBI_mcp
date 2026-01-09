import fetch from "node-fetch";
export class EBISummarySuggestionsHandler {
    async run(args) {
        const { term, size = 10 } = args;
        if (!term) {
            throw new Error("term is required");
        }
        const params = new URLSearchParams({
            term,
            size: String(size)
        });
        const url = `https://www.ebi.ac.uk/ebisearch/summary/api/suggestion?` +
            params.toString();
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`EBI summary suggestion failed (${res.status})`);
        }
        const data = await res.json();
        if (!Array.isArray(data.suggestions)) {
            throw new Error("Unexpected API response format: suggestions not found");
        }
        const payload = {
            term,
            suggestions: data.suggestions.map((s) => ({
                value: s
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
//# sourceMappingURL=summary_suggestions.js.map