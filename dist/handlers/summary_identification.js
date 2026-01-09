import fetch from "node-fetch";
export class EBISummaryIdentificationHandler {
    async run(args) {
        const { term, spine, tid } = args;
        if (!term) {
            throw new Error("term is required");
        }
        const params = new URLSearchParams({ term });
        if (spine)
            params.append("spine", spine);
        if (tid)
            params.append("tid", tid);
        const url = `https://www.ebi.ac.uk/ebisearch/summary/api/identification?` +
            params.toString();
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`EBI summary identification failed (${res.status})`);
        }
        const data = await res.json();
        const payload = {
            term,
            spineIds: data.spineIds ?? [],
            identifications: data.termIdentificationMap ?? {}
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
//# sourceMappingURL=summary_identification.js.map