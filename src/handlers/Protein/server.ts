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
// IMPORT TOOL HANDLERS
// ------------------------------------------------------
import { ProteinIdentityHandler } from "./handlers/proteins_.js";
import { ProteinFeaturesHandler } from "./handlers/features.js";
//import { ProteinVariationHandler } from "./handlers/variation.js";
import { ProteinProteomicsHandler } from "./handlers/proteomics.js";
import { ProteinProteomesHandler } from "./handlers/proteomes.js";
import { ProteinTaxonomyHandler } from "./handlers/taxonomy.js";
import { ProteinCoordinatesHandler } from "./handlers/coordinates.js";
import { ProteinUniParcHandler } from "./handlers/uniparc.js";
import { ProteinAccessionAnnotationsHandler } from "./handlers/protein_accession_annotations.js";

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
// INSTANTIATE TOOLS
// ------------------------------------------------------
const tools = {
  proteins: new ProteinIdentityHandler(),
  features: new ProteinFeaturesHandler(),
  //variation: new ProteinVariationHandler(),
  proteomics: new ProteinProteomicsHandler(),
  proteomes: new ProteinProteomesHandler(),
  taxonomy: new ProteinTaxonomyHandler(),
  coordinates: new ProteinCoordinatesHandler(),
  uniparc: new ProteinUniParcHandler(),
  accession_annotations: new ProteinAccessionAnnotationsHandler()
};

// ------------------------------------------------------
// CREATE MCP SERVER (CAPABILITIES MUST MATCH INIT)
// ------------------------------------------------------
const server = new Server(
  { name: "uniprot_mcp", version: "1.0.0" },
  {
    capabilities: {
      tools: { list: true, call: true }
    }
  }
);

// ------------------------------------------------------
// INITIALIZE HANDLER
// ------------------------------------------------------
server.setRequestHandler(InitializeRequestSchema, async () => {
  console.error("Initialize handler invoked");

  return {
    protocolVersion: "2025-06-18",
    serverInfo: { name: "uniprot_mcp", version: "1.0.0" },
    capabilities: {
      tools: { list: true, call: true }
    }
  };
});

// ------------------------------------------------------
// LIST TOOLS HANDLER
// ------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.keys(tools).map(name => ({
    name,
    description: `UniProt MCP tool: ${name}`,
    inputSchema: { type: "object" }
  }))
}));

// ------------------------------------------------------
// CALL TOOL HANDLER
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
      content: [
        {
          type: "text",
          text: err?.message ?? String(err)
        }
      ]
    };
  }
});

// ------------------------------------------------------
// START SERVER (DXT SAFE)
// ------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("UniProt MCP connected");

  // REQUIRED: keeps stdio alive in Claude Desktop
  process.stdin.resume();
}

main().catch(err => {
  console.error("Fatal MCP startup error:", err);
});
