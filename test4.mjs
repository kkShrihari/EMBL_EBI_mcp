import { EBICrossReferenceTargetedHandler } from "./dist/handlers/xref_targeted.js";

const xref = new EBICrossReferenceTargetedHandler();

const TESTS = [
  // -------------------------------
  // UniProt as source
  // -------------------------------
  { src: "uniprot", id: "P04637", tgt: "ensembl_gene" },
  { src: "uniprot", id: "P04637", tgt: "refseq" },
  { src: "uniprot", id: "P04637", tgt: "pdb" },
  { src: "uniprot", id: "P04637", tgt: "go" },
  { src: "uniprot", id: "P04637", tgt: "interpro" },
  { src: "uniprot", id: "P04637", tgt: "pfam" },
  { src: "uniprot", id: "P04637", tgt: "reactome" },

  // -------------------------------
  // Ensembl Gene as source
  // -------------------------------
  { src: "ensembl_gene", id: "ENSG00000141510", tgt: "uniprot" },
  { src: "ensembl_gene", id: "ENSG00000141510", tgt: "refseq" },
  { src: "ensembl_gene", id: "ENSG00000141510", tgt: "go" },
  { src: "ensembl_gene", id: "ENSG00000141510", tgt: "reactome" },

  // -------------------------------
  // RefSeq as source
  // -------------------------------
  { src: "refseq", id: "NM_000546", tgt: "uniprot" },
  { src: "refseq", id: "NM_000546", tgt: "ensembl_gene" },

  // -------------------------------
  // PDB as source
  // -------------------------------
  { src: "pdb", id: "1TUP", tgt: "uniprot" },

  // -------------------------------
  // EMBL as source
  // -------------------------------
  { src: "embl", id: "X54156", tgt: "uniprot" }
];

for (const t of TESTS) {
  console.log(`\nXREF TARGETED: ${t.src} → ${t.tgt}`);
  const res = await xref.run({
    domain: t.src,
    entryIds: t.id,
    targetDomain: t.tgt
  });
  console.log("✔ success, entries:", res.structuredContent.count);
}

console.log("\nALL VALID XREF TARGETED TESTS PASSED ✅");
