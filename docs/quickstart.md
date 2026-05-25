# Quickstart

## Endpoint

```text
https://jcodeharness.clauxel.com/mcp
```

## Authentication

Use a bearer token from https://jcodeharness.clauxel.com/?utm_source=github_docs&utm_medium=directory&utm_campaign=sbl202605r25.

```http
Authorization: Bearer <token>
```

## Client Setup

Use the remote MCP endpoint in clients that support Streamable HTTP. Keep the URL exact and add the bearer token through the client's secret or environment-variable mechanism.

## Test Request Shape

```json
{
  "jsonrpc": "2.0",
  "id": "tools-list",
  "method": "tools/list",
  "params": {}
}
```
