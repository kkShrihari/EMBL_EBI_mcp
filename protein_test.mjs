// import { ProteinUniParcHandler } from "./dist/handlers/Protein/handlers/uniparc.js";

import { ProteinUniParcHandler } from "./dist/handlers/Protein/handlers/uniparc.js";

const handler = new ProteinUniParcHandler();

async function test(title, args) {
  console.log("\n==============================");
  console.log(`🧪 TEST: ${title}`);
  console.log("==============================");

  try {
    const res = await handler.run(args);
    console.log("✅ SUCCESS");
    console.log(JSON.stringify(res.structuredContent, null, 2));
  } catch (err) {
    console.error("❌ ERROR");
    console.error(err.message);
  }
}

/* -------------------------------
   SEARCH
-------------------------------- */

await test("UniParc search (accession:P69905, default size=3)", {
  action: "search",
  query: "accession:P69905"
});

await test("UniParc search (protein existence)", {
  action: "search",
  query: "protein_name:hemoglobin",
  size: 5
});

/* -------------------------------
   BY ACCESSION
-------------------------------- */

await test("UniParc by UniProtKB accession (P04637)", {
  action: "by_accession",
  accession: "P04637"
});

/* -------------------------------
   BEST GUESS
-------------------------------- */

await test("UniParc bestguess (P04637)", {
  action: "bestguess",
  query: "P04637"
});

/* -------------------------------
   DB REFERENCE
-------------------------------- */

await test("UniParc by DB reference (RefSeq)", {
  action: "by_dbreference",
  dbid: "RefSeq:NP_000537"
});

/* -------------------------------
   PROTEOME
-------------------------------- */

await test("UniParc by proteome (Human UP000005640)", {
  action: "by_proteome",
  upid: "UP000005640",
  size: 3
});

/* -------------------------------
   SEQUENCE (POST)
-------------------------------- */

await test("UniParc by sequence (short peptide)", {
  action: "by_sequence",
  sequence: "MSEQNNTEMTFQIQRIYTKDISFEAPNAPHVFQ"
});

/* -------------------------------
   BY UPI
-------------------------------- */

await test("UniParc by UPI (UPI000002C3F2)", {
  action: "by_upi",
  upi: "UPI000002C3F2"
});

console.log("\n🎉 ALL UNIPARC TESTS COMPLETED");

/*
UniParc provides a non-redundant protein sequence archive that assigns
stable UniParc Identifiers (UPIs) to identical protein sequences across
all source databases. The search action supports structured query syntax
such as taxonomy_id, protein_name, or database cross-references and returns
deduplicated sequence records with minimal metadata. The by_accession and
bestguess actions accept UniProtKB accessions and resolve them to the
corresponding UniParc entry or best representative sequence. The
by_dbreference action supports external database identifiers (e.g. RefSeq,
EMBL, Ensembl) and returns UniParc entries linked to those records. The
by_proteome action retrieves all UniParc sequences associated with a given
UniProt Proteome ID and may return large result sets, which are intentionally
trimmed. The by_sequence action performs a POST-based sequence lookup and
returns exact or near-exact sequence matches, while by_upi retrieves a
single UniParc record directly. Across all actions, results are limited to
three entries by default, up to a maximum of ten when requested, and each
entry is trimmed to essential biological fields only, ensuring predictable,
efficient, and production-safe responses.
*/












// import { ProteinProteomicsHandler } from "./dist/handlers/Protein/handlers/proteomics.js";

// const handler = new ProteinProteomicsHandler();

// async function test(title, args) {
//   console.log("\n==============================");
//   console.log(`🧪 TEST: ${title}`);
//   console.log("==============================");

//   try {
//     const res = await handler.run(args);
//     console.log("✅ SUCCESS");
//     console.log(JSON.stringify(res.structuredContent, null, 2));
//   } catch (err) {
//     console.error("❌ ERROR");
//     console.error(err.message);
//   }
// }

// /* -------------------------------
//    METADATA
// -------------------------------- */

// await test("Proteomics species (list, default size=3)", {
//   action: "species"
// });

// await test("Proteomics species search (taxId:9606)", {
//   action: "species_search",
//   query: "taxId:9606"
// });

// /* -------------------------------
//    NON-PTM
// -------------------------------- */

// await test("Non-PTM peptides (by accession)", {
//   action: "non_ptm_by_accession",
//   accession: "P04637"
// });


// /* -------------------------------
//    PTM
// -------------------------------- */

// await test("PTM peptides (by accession)", {
//   action: "ptm_by_accession",
//   accession: "P04637"
// });


// /* -------------------------------
//    HPP
// -------------------------------- */

// await test("HPP peptides (by accession P04639)", {
//   action: "hpp_by_accession",
//   accession: "P04637",
//   size: 3
// });


// console.log("\n🎉 ALL PROTEOMICS TESTS COMPLETED");
// //The species action supports only metadata listing and returns all organisms that have any proteomics coverage, including their taxId, proteome ID, and which data types (non-PTM, PTM, HPP) are available; it does not support queries or accessions, and empty PTM or HPP arrays are expected and biologically valid. The species_search action supports only structured filters such as taxId:9606 or upId:UP000005640 and does not support free-text searches like “human” or “Homo sapiens”; it works by filtering the full species list because the upstream search endpoint is unreliable. For peptide-level data, non_ptm_by_accession and ptm_by_accession are the only supported and stable approaches, requiring a valid UniProtKB accession and returning trimmed, protein-specific peptide evidence; search-based variants such as non_ptm_search or ptm_search are intentionally disabled because they produce invalid parameters or unstable results upstream. The hpp_by_accession action is also accession-only and human-specific (taxId 9606), returning Human Proteome Project evidence from trusted sources such as HppPeptideAtlas and HppMassIVE; species-level or keyword-based HPP searches are not supported and are explicitly blocked to prevent excessive payloads and unreliable behavior. Across all supported proteomics actions, the output is intentionally limited to three results by default, allows up to ten when requested, and further constrains nested evidence data to essential fields only, ensuring predictable, biologically correct, and production-safe responses.















// import { ProteinProteomesHandler } from "./dist/handlers/Protein/handlers/proteomes.js";

// const handler = new ProteinProteomesHandler();

// async function test(title, args) {
//   console.log("\n==============================");
//   console.log(`🧪 TEST: ${title}`);
//   console.log("==============================");

//   try {
//     const res = await handler.run(args);
//     console.log("✅ SUCCESS");
//     console.log(JSON.stringify(res.structuredContent, null, 2));
//   } catch (err) {
//     console.error("❌ ERROR");
//     console.error(err.message);
//   }
// }

// /* -------------------------------
//    PROTEOMES
// -------------------------------- */

// await test("Proteomes search (Homo sapiens)", {
//   action: "proteomes_search",
//   query: "Homo sapiens"
// });

// await test("Proteome by UPID", {
//   action: "proteome_by_upid",
//   upid: "UP000005640"
// });

// await test("Proteins by proteome (UPID → UniProtKB)", {
//   action: "proteins_by_proteome",
//   upid: "UP000005640"
// });

// /* -------------------------------
//    UNIPROTKB (GENE → PROTEINS)
// -------------------------------- */

// await test("Proteins by gene (BRCA1)", {
//   action: "proteins_by_gene",
//   query: "BRCA1"
// });

// /* -------------------------------
//    GENECENTRIC (MISSING BEFORE ✅)
// -------------------------------- */

// await test("GeneCentric search (BRCA1)", {
//   action: "genecentric_search",
//   query: "BRCA1"
// });

// await test("GeneCentric by accession (P38398)", {
//   action: "genecentric_by_accession",
//   accession: "P38398"
// });

// console.log("\n🎉 ALL TESTS COMPLETED");
