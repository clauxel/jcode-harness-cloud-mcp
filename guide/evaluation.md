# Evaluation Guide

Use this page to evaluate whether JCode Harness Cloud fits a real workflow.

## What To Test

- OpenAI Codex harness MCP
- JCode Harness Cloud
- JCode Harness Cloud documentation
- JCode Harness Cloud remote MCP
- jcodeharness server card

## Expected Evidence

- Open JCode Harness Cloud and select the buyer plan.
- Create or request a bearer token from the hosted product.
- Add https://jcodeharness.clauxel.com/mcp to a compatible MCP client.
- Run tools/list, then call plan_coding_task with public-safe sample data.
- Save the returned receipt or export for human review.

## Risk Checks

- Do not put API keys, tokens, payment details, private logs, or customer records in public issues.
- Use public-safe sample data for examples and directory submissions.
- Treat generated receipts and scores as reviewer evidence, not as a substitute for accountable human approval.

## Buyer Path

Default plan: team.

- https://jcodeharness.clauxel.com/checkout/?utm_source=github&utm_medium=documentation&utm_campaign=jcodeharness_public_docs&utm_content=evaluation_checkout
