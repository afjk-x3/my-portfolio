<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- Keep the Next.js block above untouched -->

# Builder Instructions (OpenCode)

## Role
- You are the Builder / Code Implementer.
- Work sequentially through `tasks.md` created by Claude Code.
- Do not make architectural changes without updating `tasks.md`.

## Execution Protocol
1. Take one task at a time from `tasks.md`.
2. Implement the required files using TypeScript, Tailwind CSS, and Next.js App Router best practices.
3. After completing a task, run `npm run build` to confirm there are no syntax or typing errors.
4. Mark the task as completed (`[x]`) in `tasks.md` before moving to the next one.
