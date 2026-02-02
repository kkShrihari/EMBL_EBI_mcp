// ------------------------------------------------------
// GLOBAL ERROR VISIBILITY (DXT REQUIRED)
// ------------------------------------------------------
process.on("uncaughtException", err => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled rejection:", err);
});

// ------------------------------------------------------
// IMPORT SEARCH HANDLERS
// ------------------------------------------------------
import { EBISearchAllHandler } from "./handlers/search/handlers/search_all.js";
import { EBISearchDomainHandler } from "./handlers/search/handlers/search_domain.js";
import { EBIGetEntryHandler } from "./handlers/search/handlers/get_entry.js";
import { EBICrossReferenceTargetedHandler } from "./handlers/search/handlers/xref_targeted.js";
import { EBICrossReferenceAllHandler } from "./handlers/search/handlers/xref_all.js";
import { EBICrossReferenceDomainHandler } from "./handlers/search/handlers/xref_domain.js";
import { EBIMoreLikeThisSameDomainHandler } from "./handlers/search/handlers/more_like_this_same_domain.js";
import { EBIMoreLikeThisCrossDomainHandler } from "./handlers/search/handlers/more_like_this_cross_domain.js";
import { EBISummarySuggestionsHandler } from "./handlers/search/handlers/summary_suggestions.js";
import { EBISummaryIdentificationHandler } from "./handlers/search/handlers/summary_identification.js";
import { EBISummaryMultiReferenceHandler } from "./handlers/search/handlers/summary_multireference.js";
import { EBISummaryDetailsHandler } from "./handlers/search/handlers/summary_details.js";

// ------------------------------------------------------
// IMPORT PROTEIN HANDLERS
// ------------------------------------------------------
import { ProteinIdentityHandler } from "./handlers/Protein/handlers/proteins_.js";
import { ProteinFeaturesHandler } from "./handlers/Protein/handlers/features.js";
import { ProteinProteomicsHandler } from "./handlers/Protein/handlers/proteomics.js";
import { ProteinProteomesHandler } from "./handlers/Protein/handlers/proteomes.js";
import { ProteinTaxonomyHandler } from "./handlers/Protein/handlers/taxonomy.js";
import { ProteinCoordinatesHandler } from "./handlers/Protein/handlers/coordinates.js";
import { ProteinUniParcHandler } from "./handlers/Protein/handlers/uniparc.js";
import { ProteinAccessionAnnotationsHandler } from "./handlers/Protein/handlers/protein_accession_annotations.js";

// ------------------------------------------------------
// IMPORT PDBe HANDLERS
// ------------------------------------------------------
import { PDBeBeaconsHandler } from "./handlers/PDBe/handlers/3DBeacons.js";
import { PDBeComplexHandler } from "./handlers/PDBe/handlers/complex.js";
import { PDBeVariantRelatedHandler } from "./handlers/PDBe/handlers/variant_related.js";
import { PDBeTopologyHandler } from "./handlers/PDBe/handlers/topology.js";
import {PDBeRfamMappingsHandler} from "./handlers/PDBe/handlers/Rfam.js";
import {PDBePisaInterfaceHandler} from "./handlers/PDBe/handlers/Pisa.js";
import {PDBeCompoundsHandler} from "./handlers/PDBe/handlers/compounds.js";
import {PDBeUniProtHandler} from "./handlers/PDBe/handlers/uniprot.js";
import {PDBeValidationHandler} from "./handlers/PDBe/handlers/validation.js"
import {PDBeMappingsAndTopologyHandler} from "./handlers/PDBe/handlers/sifts.js"
// ------------------------------------------------------
// MCP SDK IMPORTS
// ------------------------------------------------------
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// ------------------------------------------------------
// INSTANTIATE TOOLS (SEARCH + PROTEIN)
// ------------------------------------------------------
const tools = {
  // -------- SEARCH --------
  search_all: new EBISearchAllHandler(),
  search_domain: new EBISearchDomainHandler(),
  search_get_entry: new EBIGetEntryHandler(),
  search_xref_targeted: new EBICrossReferenceTargetedHandler(),
  search_xref_all: new EBICrossReferenceAllHandler(),
  search_xref_domain: new EBICrossReferenceDomainHandler(),
  search_more_like_this_same_domain: new EBIMoreLikeThisSameDomainHandler(),
  search_more_like_this_cross_domain: new EBIMoreLikeThisCrossDomainHandler(),
  search_summary_suggestions: new EBISummarySuggestionsHandler(),
  search_summary_identification: new EBISummaryIdentificationHandler(),
  search_summary_multireference: new EBISummaryMultiReferenceHandler(),
  search_summary_details: new EBISummaryDetailsHandler(),

  // -------- PROTEIN --------
  protein_identity: new ProteinIdentityHandler(),
  protein_features: new ProteinFeaturesHandler(),
  protein_proteomics: new ProteinProteomicsHandler(),
  protein_proteomes: new ProteinProteomesHandler(),
  protein_taxonomy: new ProteinTaxonomyHandler(),
  protein_coordinates: new ProteinCoordinatesHandler(),
  protein_uniparc: new ProteinUniParcHandler(),
  protein_accession_annotations: new ProteinAccessionAnnotationsHandler(),

  // -------- PDBe / 3D-BEACONS --------
  pdbe_beacons: new PDBeBeaconsHandler(),
  pdbe_complex: new PDBeComplexHandler(),
  pdbe_variantRelated: new PDBeVariantRelatedHandler(),
  pdbe_topology: new PDBeTopologyHandler(),
  pdbe_rfamMappings: new PDBeRfamMappingsHandler(),
  pdbe_pisa: new PDBePisaInterfaceHandler(),
  pdbe_compounds: new PDBeCompoundsHandler(),
  pdbe_uniport: new PDBeUniProtHandler(),
  pdbe_validation: new PDBeValidationHandler(),
  pdbe_sifts: new PDBeMappingsAndTopologyHandler()
};

// ------------------------------------------------------
// CREATE MCP SERVER
// ------------------------------------------------------
const server = new Server(
  { name: "embl_ebi_mcp", version: "1.0.0" },
  {
    capabilities: {
      tools: { list: true, call: true }
    }
  }
);

// ------------------------------------------------------
// INITIALIZE HANDLER
// ------------------------------------------------------
server.setRequestHandler(InitializeRequestSchema, async () => ({
  protocolVersion: "2025-06-18",
  serverInfo: { name: "embl_ebi_mcp", version: "1.0.0" },
  capabilities: {
    tools: { list: true, call: true }
  }
}));

// ------------------------------------------------------
// LIST TOOLS
// ------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.keys(tools).map(name => ({
    name,
    description: `EMBL-EBI MCP tool: ${name}`,
    inputSchema: { type: "object" }
  }))
}));

// ------------------------------------------------------
// CALL TOOL
// ------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    if (!(name in tools)) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return await (tools as any)[name].run(args ?? {});
  } catch (err: any) {
    console.error(`Tool error (${name}):`, err);
    return {
      isError: true,
      content: [{ type: "text", text: err?.message ?? String(err) }]
    };
  }
});

// ------------------------------------------------------
// START SERVER (DXT SAFE)
// ------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EMBL-EBI MCP connected");
  process.stdin.resume(); // REQUIRED for Claude Desktop
}

main().catch(err => {
  console.error("Fatal MCP startup error:", err);
});
