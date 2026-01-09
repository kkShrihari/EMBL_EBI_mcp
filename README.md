# EMBL-EBI MCP Server

An **MCP (Model Context Protocol) server** that exposes programmatic access to **EMBL-EBI bioinformatics resources** (e.g. UniProt and related APIs) as structured tools for LLMs and AI agents.

This project allows MCP-compatible clients (such as Claude Desktop or other MCP hosts) to query EMBL-EBI data sources in a reproducible, typed, and machine-readable way.

---

## ✨ Features

- MCP-compliant server implementation
- TypeScript-based, strongly typed handlers
- Integration with EMBL-EBI REST APIs (e.g. UniProt)
- Clean separation of tools, schemas, and transport
- Designed for LLM tool usage (search, lookup, metadata retrieval)

---

## 📁 Project Structure

```
EMBL_EBI_mcp/
│
├── README.md
│   └── Project overview, setup instructions, MCP usage, and workflow
│
├── manifest.json
│   └── MCP server manifest
│       • Server metadata (name, version)
│       • Tool definitions exposed to MCP clients
│       • Input/output schemas for each handler
│
├── package.json
│   └── Node.js project configuration
│       • Dependencies (e.g. node-fetch, MCP SDK)
│       • Dev dependencies (TypeScript, build tools)
│       • Scripts: build, start, dev
│
├── package-lock.json
│   └── Locked dependency tree for reproducible installs
│
├── tsconfig.json
│   └── TypeScript compiler configuration
│       • Source directory: src/
│       • Output directory: dist/
│       • Module target and strictness
│
├── run.sh
│   └── Convenience script to build and/or start the MCP server
│
├── node_modules/
│   └── Installed Node.js dependencies (generated)
│
├── src/
│   ├── server.ts
│   │   └── Main MCP server entry point (TypeScript)
│   │       • Loads manifest.json
│   │       • Registers MCP tools
│   │       • Routes tool calls to handlers
│   │
│   ├── handlers/
│   │   └── MCP tool implementations (1 file = 1 tool)
│   │
│   │   ├── get_entry.ts
│   │   │   └── Retrieve a single database entry by accession or ID
│   │   │
│   │   ├── get_raw_data.ts
│   │   │   └── Fetch raw API payloads without post-processing
│   │   │
│   │   ├── search_all.ts
│   │   │   └── Broad search across all supported domains
│   │   │
│   │   ├── search_domain.ts
│   │   │   └── Domain-specific search queries
│   │   │
│   │   ├── xref_all.ts
│   │   │   └── Retrieve all cross-references for an entry
│   │   │
│   │   ├── xref_domain.ts
│   │   │   └── Cross-references limited to a specific domain
│   │   │
│   │   ├── xref_targeted.ts
│   │   │   └── Targeted cross-reference queries with filters
│   │   │
│   │   ├── more_like_this_cross_domain.ts
│   │   │   └── Similarity search across multiple domains
│   │   │
│   │   ├── more_like_this_same_domain.ts
│   │   │   └── Similarity search within a single domain
│   │   │
│   │   │
│   │   ├── summary_identification.ts
│   │   │   └── Entry identification summary
│   │   │
│   │   ├── summary_details.ts
│   │   │   └── Detailed metadata summaries
│   └── utils/
│       └── utils.ts
│
├── dist/
│   ├── server.js
│   │   └── Compiled MCP server (runtime entry point)
│   │
│   ├── server.d.ts
│   │   └── Type declarations for server
│   │
│   ├── handlers/
│   │   └── Compiled JavaScript versions of all handlers
│   │       • `.js` – runtime code
│   │       • `.d.ts` – type definitions
│   │       • `.map` – source maps
│   │
│   └── utils/
│       └── Compiled shared utilities
│
├── test.mjs
   └── Ad-hoc test script for validating handlers

```

---

## 🚀 Getting Started

### 1️⃣ Prerequisites

- Node.js ≥ 18
- npm or pnpm
- An MCP-compatible client (e.g. Claude Desktop)

---

### 2️⃣ Install Dependencies

```bash
npm install
npm install node-fetch
```

---

### 3️⃣ Build the Project

```bash
npm run build
```

---

### 4️⃣ Run the MCP Server

```bash
npm start
```

---

## 🔌 Using with an MCP Client

### Example: Claude Desktop

```json
{
  "mcpServers": {
    "embl-ebi": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
```

---

## 🧬 Capabilities

- UniProt accession lookup
- Protein metadata retrieval
- Organism-based searches
- Structured API responses for LLMs
---



