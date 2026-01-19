// import fetch from "node-fetch";

// const UNIPROTKB_BASE = "https://rest.uniprot.org/uniprotkb";

// /* --------------------------------
//    HELPERS
// -------------------------------- */

// type UniProtSearchResponse = {
//   results?: Array<{
//     primaryAccession?: string;
//   }>;
// };

// type UniProtFeature = {
//   type?: string;
//   begin?: string;
//   end?: string;
//   description?: string;
//   alternativeSequence?: string;
//   xrefs?: Array<{ id?: string; name?: string }>;
// };

// function extractVariants(entry: any): UniProtFeature[] {
//   return Array.isArray(entry.features)
//     ? entry.features.filter(
//         (f: UniProtFeature) => f.type === "VARIANT"
//       )
//     : [];
// }

// function matchesLocation(
//   variant: UniProtFeature,
//   location?: string
// ) {
//   if (!location || !variant.begin) return true;
//   const [start, end] = location.split("-").map(Number);
//   const pos = Number(variant.begin);
//   return pos >= start && pos <= end;
// }

// function matchesDb(
//   variant: UniProtFeature,
//   dbid?: string
// ) {
//   if (!dbid) return true;
//   return (variant.xrefs ?? []).some(
//     x => x.id === dbid
//   );
// }

// /* --------------------------------
//    HANDLER
// -------------------------------- */

// export class ProteinVariationHandler {
//   async run(args: {
//     action:
//       | "search"
//       | "by_accession"
//       | "by_accession_locations"
//       | "by_dbsnp"
//       | "by_hgvs";

//     query?: string;
//     accession?: string;
//     accession_locations?: string;
//     dbid?: string;
//     hgvs?: string; // informational only

//     location?: string;
//     size?: number;
//   }) {
//     let accessions: string[] = [];

//     /* --------------------------------
//        RESOLVE ACCESSIONS
//     -------------------------------- */

//     if (args.action === "search") {
//       if (!args.query) {
//         throw new Error("query is required for search");
//       }

//       const res = await fetch(
//         `${UNIPROTKB_BASE}/search?query=${encodeURIComponent(
//           args.query
//         )}&format=json&size=${args.size ?? 5}`
//       );

//       if (!res.ok) {
//         throw new Error(
//           `UniProtKB search failed (${res.status})`
//         );
//       }

//       const data = (await res.json()) as UniProtSearchResponse;

//       const results = Array.isArray(data.results)
//         ? data.results
//         : [];

//       accessions = results
//         .map(r => r.primaryAccession)
//         .filter(
//           (v): v is string => Boolean(v)
//         );

//       if (accessions.length === 0) {
//         return {
//           structuredContent: {
//             action: args.action,
//             count: 0,
//             data: []
//           }
//         };
//       }
//     }

//     if (args.action === "by_accession" && args.accession) {
//       accessions = [args.accession];
//     }

//     if (
//       args.action === "by_accession_locations" &&
//       args.accession_locations
//     ) {
//       accessions = args.accession_locations
//         .split("|")
//         .map(v => v.split(":")[0]);
//     }

//     if (
//       (args.action === "by_dbsnp" ||
//         args.action === "by_hgvs") &&
//       args.accession
//     ) {
//       accessions = [args.accession];
//     }

//     if (accessions.length === 0) {
//       throw new Error("No accession(s) resolved");
//     }

//     /* --------------------------------
//        FETCH + COLLECT VARIANTS
//     -------------------------------- */

//     const variants: any[] = [];

//     for (const acc of accessions) {
//       const res = await fetch(
//         `${UNIPROTKB_BASE}/${acc}.json`
//       );
//       if (!res.ok) continue;

//       const entry = await res.json();
//       const entryVariants = extractVariants(entry);

//       for (const v of entryVariants) {
//         if (
//           matchesLocation(v, args.location) &&
//           matchesDb(v, args.dbid)
//         ) {
//           variants.push({
//             accession: acc,
//             begin: v.begin,
//             end: v.end,
//             description: v.description,
//             alternativeSequence: v.alternativeSequence,
//             xrefs: v.xrefs ?? []
//           });
//         }
//       }
//     }

//     /* --------------------------------
//        RESPONSE
//     -------------------------------- */

//     const payload = {
//       action: args.action,
//       count: variants.length,
//       data: variants
//     };

//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(payload, null, 2)
//         }
//       ],
//       structuredContent: payload
//     };
//   }
// }
