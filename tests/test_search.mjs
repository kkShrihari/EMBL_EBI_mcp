// -------------------------------------------------------------
// LOCAL TEST SCRIPT FOR EBI SEARCH MCP HANDLERS
// -------------------------------------------------------------

// -------------------------------------------------------------
// IMPORT HANDLERS (FROM dist)
// -------------------------------------------------------------
import { EBISearchAllHandler } from "./dist/handlers/search_all.js";
import { EBISearchDomainHandler } from "./dist/handlers/search_domain.js";
import { EBIGetEntryHandler } from "./dist/handlers/get_entry.js";
import { EBICrossReferenceTargetedHandler } from "./dist/handlers/xref_targeted.js";
import { EBICrossReferenceAllHandler } from "./dist/handlers/xref_all.js";
import { EBICrossReferenceDomainHandler } from "./dist/handlers/xref_domain.js";
import { EBIMoreLikeThisSameDomainHandler } from "./dist/handlers/more_like_this_same_domain.js";
import { EBIMoreLikeThisCrossDomainHandler } from "./dist/handlers/more_like_this_cross_domain.js";
import { EBIGetRawDataHandler } from "./dist/handlers/get_raw_data.js";
import { EBISummarySuggestionsHandler } from "./dist/handlers/summary_suggestions.js";
import { EBISummaryIdentificationHandler } from "./dist/handlers/summary_identification.js";
import { EBISummaryMultiReferenceHandler } from "./dist/handlers/summary_multireference.js";
import { EBISummaryDetailsHandler } from "./dist/handlers/summary_details.js";

// -------------------------------------------------------------
// INSTANTIATE HANDLERS
// -------------------------------------------------------------
const searchAll = new EBISearchAllHandler();
const searchDomain = new EBISearchDomainHandler();
const getEntry = new EBIGetEntryHandler();
//const xrefTargeted = new EBICrossReferenceTargetedHandler();
const xrefAll = new EBICrossReferenceAllHandler();
const xrefDomain = new EBICrossReferenceDomainHandler();
const moreLikeSame = new EBIMoreLikeThisSameDomainHandler();
const moreLikeCross = new EBIMoreLikeThisCrossDomainHandler();
const rawData = new EBIGetRawDataHandler();
const summarySuggest = new EBISummarySuggestionsHandler();
const summaryIdentify = new EBISummaryIdentificationHandler();
const summaryMulti = new EBISummaryMultiReferenceHandler();
const summaryDetails = new EBISummaryDetailsHandler();

















// -------------------------------------------------------------
// TEST CASES (UNCOMMENT AS NEEDED)
// -------------------------------------------------------------

// // -------------------------------------------------------------
// // TEST 1 — SEARCH ALL   ---- done finished
// // -------------------------------------------------------------
// console.log("\n SEARCH ALL (with hierarchy)\n");

// const res1 = await searchAll.run({
//   query: "TP53",
//   includeHierarchy: false,
//   maxDepth: 4
// });

// console.log(JSON.stringify(res1, null, 2));





















// -------------------------------------------------------------
// TEST 2 — SEARCH DOMAIN (UniProt)  --- done finished 
// -------------------------------------------------------------
// const testCases = [
//   { domain: "uniprot", query: "TP53", size: 5 },
//   { domain: "uniprot", query: "P04637", size: 3 },
//   { domain: "uniprot", query: "\"tumor protein p53\"", size: 10 },

//   { domain: "ensembl_genes", query: "BRCA1", size: 5 },
//   { domain: "ensembl_genomes", query: "rpoB", size: 5 },

//   { domain: "pdb", query: "TP53", size: 5 },
//   { domain: "interpro", query: "p53", size: 5 },
//   { domain: "pfam", query: "p53", size: 5 },

//   { domain: "literature", query: "TP53", size: 5 },
//   { domain: "expressionatlas", query: "TP53", size: 5 },

//   { domain: "chembl", query: "TP53", size: 5 },
//   { domain: "variation", query: "TP53", size: 5 }
// ];

// for (const { domain, query, size } of testCases) {
//   console.log(
//     `\nTEST — domain=${domain} | query=${query} | size=${size}\n`
//   );

//   try {
//     const res = await searchDomain.run({ domain, query, size });
//     console.log(JSON.stringify(res, null, 2));
//   } catch (err) {
//     console.error(
//       `ERROR — domain=${domain} | query=${query}`,
//       err instanceof Error ? err.message : err
//     );
//   }
// }

// console.log("\nALL DOMAIN TESTS COMPLETED\n");

















// // -------------------------------------------------------------
// // TEST 3 — GET ENTRY -- done finished
// // -------------------------------------------------------------
// console.log("\n==============================");
// console.log(" GET ENTRY — TEST SUITE");
// console.log("==============================\n");

// /* -------------------------------------------
//  * TEST 1 — Single valid UniProt entry
//  * ----------------------------------------- */
// console.log("TEST 1 — Single UniProt ID");

// const res1 = await getEntry.run({
//   domain: "uniprot",
//   entryIds: "P04637"
// });
// console.log(JSON.stringify(res1, null, 2));


// /* -------------------------------------------
//  * TEST 2 — Multiple UniProt entries
//  * ----------------------------------------- */
// console.log("\nTEST 2 — Multiple UniProt IDs");

// const res2 = await getEntry.run({
//   domain: "uniprot",
//   entryIds: ["P04637", "Q9Y2B4"]
// });
// console.log(JSON.stringify(res2, null, 2));


// /* -------------------------------------------
//  * TEST 3 — Non-existent entry ID
//  * ----------------------------------------- */
// console.log("\nTEST 3 — Invalid UniProt ID");

// try {
//   const res3 = await getEntry.run({
//     domain: "uniprot",
//     entryIds: "INVALID123"
//   });
//   console.log(JSON.stringify(res3, null, 2));
// } catch (err) {
//   console.error("Expected error:", err.message);
// }


// /* -------------------------------------------
//  * TEST 4 — PDB domain entry
//  * ----------------------------------------- */
// console.log("\nTEST 4 — PDB Entry");

// const res4 = await getEntry.run({
//   domain: "pdb",
//   entryIds: "8HKW"
// });
// console.log(JSON.stringify(res4, null, 2));


// /* -------------------------------------------
//  * TEST 5 — InterPro domain entry
//  * ----------------------------------------- */
// console.log("\nTEST 5 — InterPro Entry");

// const res5 = await getEntry.run({
//   domain: "interpro",
//   entryIds: "IPR002117"
// });
// console.log(JSON.stringify(res5, null, 2));


// /* -------------------------------------------
//  * TEST 6 — Mixed valid + invalid IDs
//  * ----------------------------------------- */
// console.log("\nTEST 6 — Mixed Valid + Invalid IDs");

// try {
//   const res6 = await getEntry.run({
//     domain: "uniprot",
//     entryIds: ["P04637", "INVALID123"]
//   });
//   console.log(JSON.stringify(res6, null, 2));
// } catch (err) {
//   console.error("Handled mixed IDs error:", err.message);
// }


// /* -------------------------------------------
//  * TEST 7 — Missing domain (input validation)
//  * ----------------------------------------- */
// console.log("\nTEST 7 — Missing domain");

// try {
//   await getEntry.run({
//     entryIds: "P04637"
//   });
// } catch (err) {
//   console.error("Expected error:", err.message);
// }


// /* -------------------------------------------
//  * TEST 8 — Missing entryIds (input validation)
//  * ----------------------------------------- */
// console.log("\nTEST 8 — Missing entryIds");

// try {
//   await getEntry.run({
//     domain: "uniprot"
//   });
// } catch (err) {
//   console.error("Expected error:", err.message);
// }


// /* -------------------------------------------
//  * TEST 9 — Batch stress test
//  * ----------------------------------------- */
// console.log("\nTEST 9 — Batch UniProt IDs");

// const res9 = await getEntry.run({
//   domain: "uniprot",
//   entryIds: [
//     "P04637",
//     "Q9Y2B4",
//     "Q9ULZ0",
//     "Q96A56",
//     "Q8IXH6"
//   ]
// });
// console.log(JSON.stringify(res9, null, 2));


// console.log("\n==============================");
// console.log(" ALL GET ENTRY TESTS COMPLETED");
// console.log("==============================\n");
























// // // -------------------------------------------------------------
// // // TEST FILE — TOOL 4: XREF TARGETED (EBI Search MCP)   ---- done finished
// // // -------------------------------------------------------------
// const xrefTargeted = new EBICrossReferenceTargetedHandler();
// // -------------------------------------------------------------
// // 15+ INPUT COMBINATIONS (MULTI-SOURCE, MULTI-DATABASE)
// // -------------------------------------------------------------
// const TEST_CASES = [
//   // ---------- UniProt ----------
//   { source: "uniprot", id: "P04637", target: "alphafold" },
//   { source: "uniprot", id: "P04637", target: "pdbe" },
//   { source: "uniprot", id: "P04637", target: "go" },
//   { source: "uniprot", id: "P04637", target: "chebi" },
//   { source: "uniprot", id: "P04637", target: "reactome" },

//   // ---------- Ensembl Gene ----------
//   { source: "ensembl_gene", id: "ENSG00000141510", target: "go" },
//   { source: "ensembl_gene", id: "ENSG00000141510", target: "chembl-target" },
//   { source: "ensembl_gene", id: "ENSG00000141510", target: "emblstandard" },
//   { source: "ensembl_gene", id: "ENSG00000141510", target: "atlas-genes" },
//   { source: "ensembl_gene", id: "ENSG00000141510", target: "ensembl_gene" },

//   // ---------- PDB ----------
//   { source: "pdb", id: "1TUP", target: "go" },
//   { source: "pdb", id: "1TUP", target: "interpro7_domain" },
//   { source: "pdb", id: "1TUP", target: "europepmc" },

//   // ---------- Taxonomy ----------
//   { source: "taxonomy", id: "9606", target: "proteomes" },

//   // ---------- UniRef ----------
//   { source: "uniref90", id: "UniRef90_P04637", target: "uniprot" }
// ];

// // -------------------------------------------------------------
// // Run tests (NO LOGIC HERE)
// // -------------------------------------------------------------
// for (const tc of TEST_CASES) {
//   console.log(`\n================================================`);
//   console.log(`SOURCE : ${tc.source}`);
//   console.log(`ID     : ${tc.id}`);
//   console.log(`TARGET : ${tc.target}`);
//   console.log(`================================================`);

//   try {
//     const res = await xrefTargeted.run({
//       domain: tc.source,
//       entryIds: tc.id,
//       targetDomain: tc.target
//     });

//     const refs = res.structuredContent.crossReferences;

//     console.log(` Source entries: ${refs.length}`);

//     for (const ref of refs) {
//       console.log(`  Source ID: ${ref.sourceId}`);
//       console.log(`  Targets (${ref.targets.length}):`);

//       for (const t of ref.targets) {
//         console.log(`    - ${t.domain}: ${t.id}`);
//       }
//     }
//   } catch (err) {
//     // Handler decides validity — test only prints
//     console.error(` ERROR`);
//     console.error(err.message);
//   }
// }

// console.log("\nALL MULTI-SOURCE / MULTI-TARGET TESTS COMPLETED ");


















// // -------------------------------------------------------------
// // TEST 5 — XREF ALL   --- all done finished
// // -------------------------------------------------------------
// const TEST_CASES = [
//   // ---------- UniProt ----------
//   { domain: "uniprot", id: "P04637", label: "TP53 (expected empty ALL-xref)" },
//   { domain: "uniprot", id: "Q9Y261", label: "UniProt alt protein" },

//   // ---------- Ensembl ----------
//   { domain: "ensembl_gene", id: "ENSG00000141510", label: "TP53 gene" },
//   { domain: "ensembl_gene", id: "ENSG00000139618", label: "BRCA2 gene" },

//   // ---------- PDB ----------
//   { domain: "pdb", id: "1TUP", label: "TP53 DNA-binding domain" },
//   { domain: "pdb", id: "4HHB", label: "Hemoglobin" },

//   // ---------- Taxonomy ----------
//   { domain: "taxonomy", id: "9606", label: "Homo sapiens" },
//   { domain: "taxonomy", id: "10090", label: "Mus musculus" },

//   // ---------- UniRef ----------
//   { domain: "uniref90", id: "UniRef90_P04637", label: "UniRef90 TP53" }
// ];

// // -------------------------------------------------------------
// // RUN TESTS
// // -------------------------------------------------------------
// for (const tc of TEST_CASES) {
//   console.log(`\n================================================`);
//   console.log(`XREF ALL`);
//   console.log(`DOMAIN : ${tc.domain}`);
//   console.log(`ID     : ${tc.id}`);
//   console.log(`LABEL  : ${tc.label}`);
//   console.log(`================================================`);

//   try {
//     const res = await xrefAll.run({
//       domain: tc.domain,
//       entryId: tc.id
//     });

//     const payload = res.structuredContent;

//     console.log(JSON.stringify(payload, null, 2));

//     if (!payload.crossReferences) {
//       console.log("No ALL-xref data (clean empty payload)");
//     } else {
//       console.log(
//         ` ${payload.count} cross-references across ${payload.crossReferences.length} domains`
//       );
//     }

//   } catch (err) {
//     console.error("✖ ERROR");
//     console.error(err.message);
//   }
// }

// console.log("\nALL XREF-ALL MULTI-DOMAIN TESTS COMPLETED");











// // -------------------------------------------------------------
// // TEST 6 — XREF DOMAIN DISCOVERY    --- all done finished
// // -------------------------------------------------------------
// console.log("\n XREF DOMAIN DISCOVERY\n");
// const res6 = await xrefDomain.run({
//   domain: "alphafold"
// });
// console.log(JSON.stringify(res6, null, 2));








// // -------------------------------------------------------------
// // TEST 7 — MORE LIKE THIS (SAME DOMAIN)  -- all done finished
// // -------------------------------------------------------------
//console.log("\n MORE LIKE THIS (SAME DOMAIN)\n");

// // ---- UniProt (best candidates) ----
// const tests = [
//   { domain: "uniprot", entryId: "P69905" },   // Hemoglobin alpha
//   { domain: "uniprot", entryId: "P68871" },   // Hemoglobin beta
//   { domain: "uniprot", entryId: "P00734" },   // Prothrombin
//   { domain: "uniprot", entryId: "P01308" },   // Insulin
//   { domain: "uniprot", entryId: "Q9Y2T7" },   // Enzyme-like protein

//   // ---- Ensembl Gene ----
//   { domain: "ensembl_gene", entryId: "ENSG00000139618" }, // BRCA2
//   { domain: "ensembl_gene", entryId: "ENSG00000157764" }, // BRAF

//   // ---- PDB ----
//   { domain: "pdb", entryId: "1A3N" },          // Hemoglobin structure
//   { domain: "pdb", entryId: "4HHB" },          // Hemoglobin tetramer

//   // ---- UniRef ----
//   { domain: "uniref90", entryId: "UniRef90_P69905" },
//   { domain: "uniref50", entryId: "UniRef50_P68871" }
// ];

// for (const t of tests) {
//   console.log(
//     `\nSOURCE: ${t.domain} | ENTRY: ${t.entryId}\n`
//   );

//   try {
//     const res = await moreLikeSame.run({
//       domain: t.domain,
//       entryId: t.entryId
//     });

//     console.log(JSON.stringify(res.structuredContent, null, 2));
//   } catch (err) {
//     console.error("ERROR:", err.message);
//   }
// }

// console.log("\n MORE LIKE THIS (SAME DOMAIN) TESTS COMPLETED\n");











// // -------------------------------------------------------------
// // TEST 8 — MORE LIKE THIS (CROSS DOMAIN)  -- done finished
// // -------------------------------------------------------------
// console.log("\n MORE LIKE THIS (CROSS DOMAIN)\n");

// const crossTests = [
//   // UniProt → Ensembl
//   { domain: "uniprot", entryId: "P04637", targetDomain: "ensembl_gene" },
//   { domain: "uniprot", entryId: "P69905", targetDomain: "ensembl_gene" },
//   { domain: "uniprot", entryId: "P68871", targetDomain: "ensembl_gene" },

//   // UniProt → PDB
//   { domain: "uniprot", entryId: "P04637", targetDomain: "pdb" },
//   { domain: "uniprot", entryId: "P69905", targetDomain: "pdb" },

//   // Ensembl → UniProt
//   { domain: "ensembl_gene", entryId: "ENSG00000139618", targetDomain: "uniprot" },
//   { domain: "ensembl_gene", entryId: "ENSG00000157764", targetDomain: "uniprot" },

//   // PDB → UniProt
//   { domain: "pdb", entryId: "1A3N", targetDomain: "uniprot" },
//   { domain: "pdb", entryId: "4HHB", targetDomain: "uniprot" },

//   // Ensembl → PDB
//   { domain: "ensembl_gene", entryId: "ENSG00000139618", targetDomain: "pdb" }
// ];

// for (const t of crossTests) {
//   console.log(
//     `\nSOURCE: ${t.domain} | ID: ${t.entryId} | TARGET: ${t.targetDomain}\n`
//   );

//   try {
//     const res = await moreLikeCross.run({
//       domain: t.domain,
//       entryId: t.entryId,
//       targetDomain: t.targetDomain
//     });

//     console.log(JSON.stringify(res.structuredContent, null, 2));
//   } catch (err) {
//     console.error("ERROR:", err.message);
//   }
// }

// console.log("\n MORE LIKE THIS (CROSS DOMAIN) TESTS COMPLETED\n");








// -------------------------------------------------------------
// TEST 9. — RAW DATA (taxonomy — EBI-supported domain)
// -------------------------------------------------------------
const TEST_CASES = [
  // ---------------- BIOLOGY ----------------
  {
    label: "TAXONOMY — Homo sapiens",
    args: { domain: "taxonomy", entryId: "9606" }
  },
  // {
  //   label: "UNIPROT — TP53",
  //   args: { domain: "uniprot", entryId: "P04637" }
  // },
  {
    label: "PDB — TP53 DNA-binding domain",
    args: { domain: "pdb", entryId: "1TUP" }
  },
  {
    label: "ENSEMBL GENE — TP53",
    args: { domain: "ensembl_gene", entryId: "ENSG00000141510" }
  },

  // ---------------- PATENTS (RAW DATA) ----------------
  {
    label: "EPO — Invalid patent (expected handled failure)",
    args: { domain: "epo", entryId: "EP1000000" }
  },
  {
    label: "USPTO — Invalid patent (expected handled failure)",
    args: { domain: "uspto", entryId: "US1000000" }
  },
  {
    label: "JPO — Invalid patent (expected handled failure)",
    args: { domain: "jpo", entryId: "JP2000000" }
  },
  {
    label: "KIPO — Invalid patent (expected handled failure)",
    args: { domain: "kipo", entryId: "KR1000000" }
  },

  // ---------------- UNSUPPORTED ----------------
  {
    label: "UNSUPPORTED DOMAIN",
    args: { domain: "literature", entryId: "TP53" }
  }
];

// -------------------------------------------------------------
// RUN TESTS
// -------------------------------------------------------------
for (const test of TEST_CASES) {
  console.log("\n================================================");
  console.log(test.label);
  console.log("ARGS:", test.args);
  console.log("================================================");

  try {
    const res = await rawData.run(test.args);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

console.log("\nALL TESTS COMPLETED\n");



// // -------------------------------------------------------------
// // TEST 10 — SUMMARY SUGGESTIONS    ---- done finished
// // -------------------------------------------------------------
// console.log("\n SUMMARY SUGGESTIONS\n");
// const res13 = await summarySuggest.run({
//   term: "MCM7"
// });
// console.log(JSON.stringify(res13, null, 2));








// // -------------------------------------------------------------
// // TEST 11 — SUMMARY IDENTIFICATION   ---- done finished
// // -------------------------------------------------------------
// console.log("\n SUMMARY IDENTIFICATION\n");
// const res = await summaryIdentify.run({
//   term: "MCM7"
// });
// console.log(JSON.stringify(res, null, 2));
// console.log("\n ALL EBI MCP HANDLER TESTS COMPLETED SUCCESSFULLY\n");
