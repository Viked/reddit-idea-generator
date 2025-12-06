# Cursor Rules

This directory contains project-specific rules for Cursor AI assistant, organized into separate `.mdc` files.

## Rule Files

- **stack.mdc**: Technology stack and framework versions (always applied)
- **coding-rules.mdc**: Core coding conventions and rules (applies to TypeScript/TSX files)
- **pre-commit-workflow.mdc**: Mandatory pre-commit validation checklist (always applied)
- **security.mdc**: Security guidelines for handling secrets (always applied)
- **zod-usage.mdc**: Zod validation library best practices (applies to validation/schema files)

## MDC Format

Each rule file uses MDC (Markdown with metadata) format:

```mdc
---
description: Brief description of the rule
globs: ["**/*.ts", "**/*.tsx"]  # Optional: file patterns
alwaysApply: true  # Optional: whether to always include
---

# Rule Content

Your rule content here...
```

## Rule Application

- **alwaysApply: true**: Rule is always included in AI context
- **alwaysApply: false**: Rule is included when relevant files are referenced
- **globs**: Specifies file patterns where the rule applies

For more information, see [Cursor Rules Documentation](https://docs.cursor.com/en/context/rules).

