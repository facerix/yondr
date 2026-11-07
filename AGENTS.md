# AGENTS.md - Yondr Project

## Setup commands
- Install deps: `pnpm install`
- Start dev server: `pnpm start`

## Code style
- **Type**: Single Page Application (SPA) / Progressive Web App
- **Stack**: TypeScript, HTML5, CSS3, Web Components
- **Storage**: Browser localStorage only (no backend)
- **Architecture**: Component-based with centralized DataStore (singleton)

## Development Guidelines
- One prompt should result in no more than one Markdown summary file
- Follow existing code patterns when developing new code
- When in doubt about anything, ask questions, don't guess
- Assume local server is running on port 8080 when you make your changes
- Application TypeScript compiles to `dist/`; service workers remain JavaScript. Imports retain `.js` specifiers for browser resolution.
- Follow-up: enable TypeScript `strict` mode after typing legacy component state and DOM null handling. The migration currently runs with `strict: false`.
- Run `pnpm test` and `pnpm build` after changes. Set `DEPLOY_TARGET` in `.env` before using `pnpm deploy:dry-run` or `pnpm deploy`.
