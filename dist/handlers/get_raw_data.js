import fetch from "node-fetch";
export class EBIGetRawDataHandler {
    async run(args) {
        const { domain, entryId } = args;
        if (!domain || !entryId) {
            throw new Error("domain and entryId are required");
        }
        const params = new URLSearchParams({
            format: "json"
        });
        const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(domain)}/rawdata/${encodeURIComponent(entryId)}?${params.toString()}`;
        const res = await fetch(url);
        // 🔹 rawdata NOT supported for many domains → return clean result
        if (res.status === 400) {
            const payload = {
                domain,
                entryId,
                contentType: null,
                rawData: null,
                supported: false
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
            throw new Error(`EBI raw data retrieval failed (${res.status})`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        let rawContent;
        if (contentType.includes("application/json")) {
            rawContent = (await res.json());
        }
        else {
            rawContent = await res.text();
        }
        const payload = {
            domain,
            entryId,
            contentType,
            rawData: rawContent
        };
        return {
            content: [
                {
                    type: "text",
                    text: typeof rawContent === "string"
                        ? rawContent.slice(0, 2000) + "\n"
                        : JSON.stringify(payload, null, 2) + "\n"
                }
            ],
            structuredContent: payload
        };
    }
}
//# sourceMappingURL=get_raw_data.js.map