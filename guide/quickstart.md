# Quickstart

JCode Harness Cloud is a hosted remote MCP for OpenAI Codex harness MCP.

## Fast Path

1. Open JCode Harness Cloud and select the buyer plan.
2. Create or request a bearer token from the hosted product.
3. Add https://jcodeharness.clauxel.com/mcp to a compatible MCP client.
4. Run tools/list, then call plan_coding_task with public-safe sample data.
5. Save the returned receipt or export for human review.

## Useful Links

- https://jcodeharness.clauxel.com/?utm_source=github&utm_medium=documentation&utm_campaign=jcodeharness_public_docs&utm_content=quickstart_home
- https://jcodeharness.clauxel.com/pricing/?utm_source=github&utm_medium=documentation&utm_campaign=jcodeharness_public_docs&utm_content=quickstart_pricing
- https://jcodeharness.clauxel.com/checkout/?utm_source=github&utm_medium=documentation&utm_campaign=jcodeharness_public_docs&utm_content=quickstart_checkout

## MCP Endpoint

```text
https://jcodeharness.clauxel.com/mcp
```

Use bearer-token authentication for production calls. Keep the token in the MCP client's secret mechanism.
