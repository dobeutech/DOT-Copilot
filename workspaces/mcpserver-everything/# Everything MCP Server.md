# Everything MCP Server

This MCP server attempts to exercise all the features of the MCP protocol. It is not intended to be a useful server, but rather a test server for builders of MCP clients. It implements prompts, tools, resources, sampling, and more to showcase MCP capabilities.

For the complete source code and latest updates, see the [official repository](https://github.com/modelcontextprotocol/servers/tree/81b9fbff4b01f8632956e3d1897dd70772176858/src/everything).

## Components

### Tools

#### echo
Simple tool to echo back input messages
- **Input:**
  - `message` (string): Message to echo back
- **Returns:** Text content with echoed message

#### add
Adds two numbers together
- **Inputs:**
  - `a` (number): First number
  - `b` (number): Second number
- **Returns:** Text result of the addition

#### longRunningOperation
Demonstrates progress notifications for long operations
- **Inputs:**
  - `duration` (number, default: 10): Duration in seconds
  - `steps` (number, default: 5): Number of progress steps
- **Returns:** Completion message with duration and steps
- Sends progress notifications during execution

#### sampleLLM
Demonstrates LLM sampling capability using MCP sampling feature
- **Inputs:**
  - `prompt` (string): The prompt to send to the LLM
  - `maxTokens` (number, default: 100): Maximum tokens to generate
- **Returns:** Generated LLM response

#### getTinyImage
Returns a small test image
- **No inputs required**
- **Returns:** Base64 encoded PNG image data

#### printEnv
Prints all environment variables
- Useful for debugging MCP server configuration
- **No inputs required**
- **Returns:** JSON string of all environment variables

#### annotatedMessage
Demonstrates how annotations can be used to provide metadata about content
- **Inputs:**
  - `messageType` (enum: "error" | "success" | "debug"): Type of message to demonstrate different annotation patterns
  - `includeImage` (boolean, default: false): Whether to include an example image
- **Returns:** Content with varying annotations:
  - Error messages: High priority (1.0), visible to both user and assistant
  - Success messages: Medium priority (0.7), user-focused
  - Debug messages: Low priority (0.3), assistant-focused
  - Optional image: Medium priority (0.5), user-focused

Example annotations:
