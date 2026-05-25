# JCode Harness Cloud

JCode Harness Cloud is a hosted remote MCP for OpenAI Codex harness MCP.

This repository is a public documentation project for JCode Harness Cloud. Its structure follows the public documentation pattern used by [MiroFish](https://github.com/clauxel/MiroFish): a short front door, a clear reading order, practical guides, reference pages, and a public-safe boundary.

## Start Here

- Website: https://jcodeharness.clauxel.com/?utm_source=github&utm_medium=documentation&utm_campaign=jcodeharness_public_docs&utm_content=readme_home
- Pricing: https://jcodeharness.clauxel.com/pricing/?utm_source=github&utm_medium=documentation&utm_campaign=jcodeharness_public_docs&utm_content=readme_pricing
- Checkout: https://jcodeharness.clauxel.com/checkout/?utm_source=github&utm_medium=documentation&utm_campaign=jcodeharness_public_docs&utm_content=readme_checkout
- Support: support@aigeamy.com

## Remote MCP

- Endpoint: https://jcodeharness.clauxel.com/mcp
- Server card: https://jcodeharness.clauxel.com/server-card.json
- Registry name: `com.clauxel.jcodeharness/jcodeharness-mcp`
- Tools: `plan_coding_task`, `suggest_safe_command`, `record_test_verdict`, `read_run_history`

## Reading Order

1. [Quickstart](guide/quickstart.md)
2. [Evaluation guide](guide/evaluation.md)
3. [Checkout and pricing](guide/checkout-and-pricing.md)
4. [Workflow notes](features/workflow.md)
5. [Security model](features/security-model.md)
6. [Public link reference](reference/links.md)

## Audience

AI product teams, operations leads, workflow owners, and technical evaluators.

## Capabilities

- Streamable HTTP MCP endpoint
- Bearer-token access for production calls
- Structured tool-call output
- Receipt-oriented evidence export
- Public server card and registry metadata
- MCP tool: plan_coding_task
- MCP tool: suggest_safe_command
- MCP tool: record_test_verdict
- MCP tool: read_run_history

## Public-Safe Boundary

This repository contains documentation only. It does not contain production source code, credentials, payment configuration, Cloudflare configuration, customer records, private analytics, or local machine paths.
