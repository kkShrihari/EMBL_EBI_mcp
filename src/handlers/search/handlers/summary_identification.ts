import fetch from "node-fetch";

const DEFAULT_SIZE = 5;
const MAX_SIZE = 15;

export class EBISummaryIdentificationHandler {
  async run(args: {
    term: string;
    spine?: string;
    tid?: string;
    size?: number;
  }) {
    const { term, spine, tid } = args;

    let size = args.size ?? DEFAULT_SIZE;
    size = Math.min(size, MAX_SIZE);

    if (!term) {
      throw new Error("term is required");
    }

    const params = new URLSearchParams({ term });
    if (spine) params.append("spine", spine);
    if (tid) params.append("tid", tid);

    const url =
      "https://www.ebi.ac.uk/ebisearch/summary/api/identification?" +
      params.toString();

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `EBI summary identification failed (${res.status})`
      );
    }

    const data: any = await res.json();

    const identifications: any[] = [];

    if (data?.termIdentificationMap) {
      for (const [spineKey, entries] of Object.entries<any>(
        data.termIdentificationMap
      )) {
        for (const e of entries) {
          if (Array.isArray(e.references)) {
            for (const r of e.references) {
              identifications.push({
                spine: spineKey,
                identifier: r?.databaseEntryReference?.identifier,
                database: r?.databaseEntryReference?.databaseName,
                label: r?.databaseEntryReference?.label,
                name: r?.databaseEntryReference?.name,
                species: r?.species,
                description: e?.description
              });
            }
          }
        }
      }
    }

    const payload = {
      term,
      identifications: identifications.slice(0, size)
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
