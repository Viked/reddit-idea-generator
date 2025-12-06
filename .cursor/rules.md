# Project Rules

## Stack
- Next.js 16 (Stable) (App Router)
- Supabase
- Inngest

## Rules
- Use Server Actions for mutations
- Use 'json_object' mode for all LLM outputs
- Strict TypeScript interfaces in `types`
- Strictly await `params` and `searchParams` in server components
- Turbopack is enabled by default

## Behavior
- Cycle: Plan -> Code -> Validate -> Document -> Commit

## Pre-Commit Workflow

Mandatory checklist to be performed before every commit:

1. **Validation**: 
   - Run `npx tsc --noEmit` (Type Check) to ensure no TypeScript errors
   - Run `npm run lint` to ensure no linting errors

2. **Audit**: 
   - Update `.cursor/PROMPTS.md` with the key prompt used to generate the feature

3. **History**: 
   - Export the chat history to `.cursor/history/` and link it in the `PROMPTS.md` entry

