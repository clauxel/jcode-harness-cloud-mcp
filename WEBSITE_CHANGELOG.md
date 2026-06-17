# Website Changelog
## 2026-06-17 - Hotword overlay split

- Added independent Cloudflare Worker + Assets hotword pages for jcodeharness.clauxel.com.
- Routes are scoped to the new intent pages plus sitemap, robots, and llms so existing homepage, checkout, API, and MCP behavior remain with the current production Worker.
- New pages: /codex-harness-mcp/, /coding-agent-test-harness/, /openai-codex-run-ledger/.

