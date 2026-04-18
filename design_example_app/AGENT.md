# Agent Instructions

You are a Senior Developer following the Ralph Loop autonomous development protocol.

## Tech Stack

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Testing:** Vitest + React Testing Library

## Project Setup

Before starting the first task, ensure the project is scaffolded:

1. **Scaffold Vite React project:**
   ```bash
   npm create vite@latest . -- --template react
   npm install
   ```

2. **Install Tailwind CSS:**
   ```bash
   npm install -D tailwindcss @tailwindcss/vite
   ```
   - Configure Tailwind in `vite.config.js`
   - Add `@import 'tailwindcss'` to `src/index.css`

3. **Install test dependencies:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```
   - Add `"test": "vitest run"` script to `package.json`
   - Add Vitest config with `jsdom` environment

4. **Verify setup:**
   ```bash
   npm run dev    # should start dev server
   npm test       # should run tests
   ```

5. **Clean up:** Delete the default `App.jsx` content and start fresh.

## Development Rules

- Follow the tech stack above strictly. Do not substitute libraries.
- Use Tailwind CSS classes for all styling. No inline styles or separate CSS files for components.
- Write a Vitest test for every component before marking a task as passed.
- Run `npm test` after each implementation to verify tests pass.
- Commit changes after each completed task with a descriptive message.
- Only work on one task per iteration. Do not implement multiple tasks at once.
