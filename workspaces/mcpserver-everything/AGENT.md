# Agent Guidelines for MCP Server Everything Documentation

## Project Structure
- This workspace contains only documentation for an MCP (Model Context Protocol) server
- Main documentation: `# Everything MCP Server.md`
- Actual source code is at: https://github.com/modelcontextprotocol/servers/tree/81b9fbff4b01f8632956e3d1897dd70772176858/src/everything

## Build/Test/Lint Commands
- No build system detected - this is a documentation-only workspace
- No package.json, Makefile, or other build configuration found

## Architecture
- MCP server implementing all protocol features: tools, resources, prompts, sampling
- Main tools: echo, add, longRunningOperation, sampleLLM, getTinyImage, printEnv, annotatedMessage
- Designed as a test server for MCP client builders, not production use

## Code Style Guidelines
- No source code present for style analysis
- Documentation uses standard Markdown formatting
- MCP protocol conventions should be followed when implementing

## Notes for Agents
- This workspace is documentation-only
- To work with actual code, clone the referenced GitHub repository
- Use this documentation to understand MCP server functionality and API structure
