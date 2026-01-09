// -------------------------------------------------------------
// TEST: XREF TARGETED — MULTI DATABASE, MULTI COMBOS
// Handler does EVERYTHING
// Test only provides input + prints output
// -------------------------------------------------------------

import { EBICrossReferenceTargetedHandler } from "./dist/handlers/xref_targeted.js";

// -------------------------------------------------------------
// Instantiate handler ONLY
// -------------------------------------------------------------
const xrefTargeted = new EBICrossReferenceTargetedHandler();

// -------------------------------------------------------------
// 15+ INPUT COMBINATIONS (MULTI-SOURCE, MULTI-DATABASE)
// -------------------------------------------------------------
const TEST_CASES = [
  // ---------- UniProt ----------
  { source: "uniprot", id: "P04637", target: "alphafold" },
  { source: "uniprot", id: "P04637", target: "pdbe" },
  { source: "uniprot", id: "P04637", target: "go" },
  { source: "uniprot", id: "P04637", target: "chebi" },
  { source: "uniprot", id: "P04637", target: "reactome" },

  // ---------- Ensembl Gene ----------
  { source: "ensembl_gene", id: "ENSG00000141510", target: "go" },
  { source: "ensembl_gene", id: "ENSG00000141510", target: "chembl-target" },
  { source: "ensembl_gene", id: "ENSG00000141510", target: "emblstandard" },
  { source: "ensembl_gene", id: "ENSG00000141510", target: "atlas-genes" },
  { source: "ensembl_gene", id: "ENSG00000141510", target: "ensembl_gene" },

  // ---------- PDB ----------
  { source: "pdb", id: "1TUP", target: "go" },
  { source: "pdb", id: "1TUP", target: "interpro7_domain" },
  { source: "pdb", id: "1TUP", target: "europepmc" },

  // ---------- Taxonomy ----------
  { source: "taxonomy", id: "9606", target: "proteomes" },

  // ---------- UniRef ----------
  { source: "uniref90", id: "UniRef90_P04637", target: "uniprot" }
];

// -------------------------------------------------------------
// Run tests (NO LOGIC HERE)
// -------------------------------------------------------------
for (const tc of TEST_CASES) {
  console.log(`\n================================================`);
  console.log(`SOURCE : ${tc.source}`);
  console.log(`ID     : ${tc.id}`);
  console.log(`TARGET : ${tc.target}`);
  console.log(`================================================`);

  try {
    const res = await xrefTargeted.run({
      domain: tc.source,
      entryIds: tc.id,
      targetDomain: tc.target
    });

    const refs = res.structuredContent.crossReferences;

    console.log(`✔ Source entries: ${refs.length}`);

    for (const ref of refs) {
      console.log(`  Source ID: ${ref.sourceId}`);
      console.log(`  Targets (${ref.targets.length}):`);

      for (const t of ref.targets) {
        console.log(`    - ${t.domain}: ${t.id}`);
      }
    }
  } catch (err) {
    // Handler decides validity — test only prints
    console.error(`✖ ERROR`);
    console.error(err.message);
  }
}

console.log("\nALL MULTI-SOURCE / MULTI-TARGET TESTS COMPLETED ✅");
