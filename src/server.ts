// ------------------------------------------------------
// FORCE EXTENSION ROOT AS WORKING DIRECTORY
// ------------------------------------------------------
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.chdir(__dirname);

// ------------------------------------------------------
// IMPORT TOOL HANDLERS (ALL 16)
// ------------------------------------------------------
import { EBISearchAllHandler } from "./handlers/search_all.js";
import { EBISearchDomainHandler } from "./handlers/search_domain.js";
import { EBIGetEntryHandler } from "./handlers/get_entry.js";
import { EBICrossReferenceTargetedHandler } from "./handlers/xref_targeted.js";
import { EBICrossReferenceAllHandler } from "./handlers/xref_all.js";
import { EBICrossReferenceDomainHandler } from "./handlers/xref_domain.js";
import { EBIAutocompleteHandler } from "./handlers/autocomplete.js";
import { EBITopTermsHandler } from "./handlers/top_terms.js";
import { EBISeqToolResultsSearchHandler } from "./handlers/seqtool_results.js";
import { EBIMoreLikeThisSameDomainHandler } from "./handlers/more_like_this_same_domain.js";
import { EBIMoreLikeThisCrossDomainHandler } from "./handlers/more_like_this_cross_domain.js";
import { EBIGetRawDataHandler } from "./handlers/get_raw_data.js";
import { EBISummarySuggestionsHandler } from "./handlers/summary_suggestions.js";
import { EBISummaryIdentificationHandler } from "./handlers/summary_identification.js";
import { EBISummaryMultiReferenceHandler } from "./handlers/summary_multireference.js";
import { EBISummaryDetailsHandler } from "./handlers/summary_details.js";

// ------------------------------------------------------
// MCP SERVER SETUP
// ------------------------------------------------------
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// ------------------------------------------------------
// INSTANTIATE HANDLERS
// ------------------------------------------------------
const tools = {
  search_all: new EBISearchAllHandler(),
  search_domain: new EBISearchDomainHandler(),
  get_entry: new EBIGetEntryHandler(),
  xref_targeted: new EBICrossReferenceTargetedHandler(),
  xref_all: new EBICrossReferenceAllHandler(),
  xref_domain: new EBICrossReferenceDomainHandler(),
  autocomplete: new EBIAutocompleteHandler(),
  top_terms: new EBITopTermsHandler(),
  seqtool_results: new EBISeqToolResultsSearchHandler(),
  more_like_this_same_domain: new EBIMoreLikeThisSameDomainHandler(),
  more_like_this_cross_domain: new EBIMoreLikeThisCrossDomainHandler(),
  get_raw_data: new EBIGetRawDataHandler(),
  summary_suggestions: new EBISummarySuggestionsHandler(),
  summary_identification: new EBISummaryIdentificationHandler(),
  summary_multireference: new EBISummaryMultiReferenceHandler(),
  summary_details: new EBISummaryDetailsHandler()
};

// ------------------------------------------------------
// CREATE MCP SERVER
// ------------------------------------------------------
const server = new Server(
  { name: "search_mcp", version: "1.0.0" },
  { capabilities: { tools: {}, sampling: {}, roots: {} } }
);

// ------------------------------------------------------
// INITIALIZE
// ------------------------------------------------------
server.setRequestHandler(InitializeRequestSchema, async () => ({
  protocolVersion: "2025-06-18",
  serverInfo: { name: "search_mcp", version: "1.0.0" },
  capabilities: { tools: { list: true, call: true } }
}));

// ------------------------------------------------------
// LIST TOOLS
// ------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.keys(tools).map(name => ({
    name,
    description: `EBI Search tool: ${name}`,
    inputSchema: { type: "object" }
  }))
}));

// ------------------------------------------------------
// CALL TOOL ROUTER
// ------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    if (!(name in tools)) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return await (tools as any)[name].run(args ?? {});
  } catch (err: any) {
    return {
      isError: true,
      content: [{ type: "text", text: err.message || String(err) }]
    };
  }
});

// ------------------------------------------------------
// START SERVER
// ------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EBI Search MCP connected");
}

main().catch(console.error);
setInterval(() => {}, 1 << 30);
