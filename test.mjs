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
import { EBIAutocompleteHandler } from "./dist/handlers/autocomplete.js";
import { EBITopTermsHandler } from "./dist/handlers/top_terms.js";
import { EBISeqToolResultsSearchHandler } from "./dist/handlers/seqtool_results.js";
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
const autocomplete = new EBIAutocompleteHandler();
const topTerms = new EBITopTermsHandler();
const seqtool = new EBISeqToolResultsSearchHandler();
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
// // TEST 1 — SEARCH ALL
// // -------------------------------------------------------------
// console.log("\n SEARCH ALL\n");
// const res1 = await searchAll.run({
//   query: "TP53",
//   size: 5
// });
// console.log(JSON.stringify(res1, null, 2));

// -------------------------------------------------------------
// TEST 2 — SEARCH DOMAIN (UniProt)
// -------------------------------------------------------------
console.log("\n SEARCH DOMAIN (uniprot)\n");
const res2 = await searchDomain.run({
  domain: "uniprot",
  query: "TP53",
  size: 5
});
console.log(JSON.stringify(res2, null, 2));

// // -------------------------------------------------------------
// // TEST 3 — GET ENTRY
// // -------------------------------------------------------------
// console.log("\n GET ENTRY\n");
// const res3 = await getEntry.run({
//   domain: "uniprot",
//   entryIds: "P04637"
// });
// console.log(JSON.stringify(res3, null, 2));

// // -------------------------------------------------------------
// // TEST FILE — TOOL 4: XREF TARGETED (EBI Search MCP)
// // -------------------------------------------------------------

// // -------------------------------------------------------------
// // Instantiate handler ONLY
// // -------------------------------------------------------------
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
// // TEST 5 — XREF ALL   [NOT YET TESTEDDDD]
// // -------------------------------------------------------------
// console.log("\n XREF ALL\n");
// const res5 = await xrefAll.run({
//   domain: "uniprot",
//   entryId: "P04637"
// });
// console.log(JSON.stringify(res5, null, 2));

// // -------------------------------------------------------------
// // TEST 6 — XREF DOMAIN DISCOVERY
// // -------------------------------------------------------------
// console.log("\n XREF DOMAIN DISCOVERY\n");
// const res6 = await xrefDomain.run({
//   domain: "uniprot"
// });
// console.log(JSON.stringify(res6, null, 2));

// // -------------------------------------------------------------
// // TEST 7 — AUTOCOMPLETE <----We removed this tool---->
// // -------------------------------------------------------------
// console.log("\n AUTOCOMPLETE\n");
// const res7 = await autocomplete.run({
//   domain: "uniprot",
//   partial: "P046",
//   size: 5
// });
// console.log(JSON.stringify(res7, null, 2));

// // -------------------------------------------------------------
// // TEST 8 — TOP TERMS    <WE ARE NOT USING THIS HANDLER>
// // -------------------------------------------------------------
// console.log("\n TOP TERMS\n");

// try {
//   const res8 = await topTerms.run({
//     domain: "uniprot",
//     fieldId: "reviewed",
//     size: 5
//   });

//   console.log("✔ SUCCESS");
//   console.log(JSON.stringify(res8.structuredContent, null, 2));
// } catch (err) {
//   console.log("✖ TOP TERMS FAILED");
//   console.log(err.message);
// }

// // -------------------------------------------------------------
// // TEST 9 — SEQ TOOL RESULTS  <not useful>
// // -------------------------------------------------------------
// console.log("\n SEQ TOOL RESULTS (BLAST JOB)\n");
// const res = await seqtool.run({
//   query: "ncbiblast-I20260109-001526-0105-63256094-p1m"
// });

// console.log(JSON.stringify(res, null, 2));


// // -------------------------------------------------------------
// // TEST 10 — MORE LIKE THIS (SAME DOMAIN)
// // -------------------------------------------------------------
// console.log("\n MORE LIKE THIS (SAME DOMAIN)\n");

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
// // TEST 11 — MORE LIKE THIS (CROSS DOMAIN)
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


// // -------------------------------------------------------------
// // TEST 12.1 — RAW DATA (UniProt — expected unsupported)
// // -------------------------------------------------------------
// console.log("\n RAW DATA — uniprot\n");
// const res121 = await rawData.run({
//   domain: "uniprot",
//   entryId: "P04637"
// });
// console.log(JSON.stringify(res121, null, 2));

// // -------------------------------------------------------------
// // TEST 13 — SUMMARY SUGGESTIONS
// // -------------------------------------------------------------
// console.log("\n SUMMARY SUGGESTIONS\n");
// const res13 = await summarySuggest.run({
//   term: "TP53"
// });
// console.log(JSON.stringify(res13, null, 2));

// // -------------------------------------------------------------
// // TEST — SUMMARY IDENTIFICATION
// // -------------------------------------------------------------
// console.log("\n SUMMARY IDENTIFICATION\n");

// const res = await summaryIdentify.run({
//   term: "TP53"
// });

// console.log(JSON.stringify(res, null, 2));


console.log("\n ALL EBI MCP HANDLER TESTS COMPLETED SUCCESSFULLY\n");
