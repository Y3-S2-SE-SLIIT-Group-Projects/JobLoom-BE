# Team Git Workflow and Contribution Policy

This guide defines the Git workflow for our university project team.  
The goal is to keep contributions clear, prevent merge conflicts, and avoid ownership disputes.

---

## 1) Branching Strategy (Simple and Clean)

Use this branch structure:

- `main` -> production-ready stable code (protected)
- `develop` -> integration branch (protected)
- `staging` -> pre-release validation branch (protected)
- `feature/*` -> individual tasks
- `bugfix/*` -> bug fixes
- `hotfix/*` -> urgent fixes to `main`

### Rules

- Do not push directly to `main`, `develop`, or `staging`.
- Every task must be implemented in a `feature/` branch.
- Use lowercase kebab-case branch names.

Examples:

- `feature/login-form`
- `feature/payment-api`
- `feature/staff-table`
- `bugfix/login-validation-error`
- `hotfix/critical-auth-crash`

---

## 2) Task Assignment Rule (Ownership Clarity)

Before coding:

1. Create a GitHub Issue.
2. Assign it to one person.
3. The assignee creates a branch from `develop`.

Example:

- Issue `#12` -> "Create Staff List Table"
- Assigned to: Sarah
- Branch: `feature/staff-list-table`

If someone else needs to contribute:

- They must comment on the issue first, or
- Get approval in group chat.

No silent coding on someone else's assigned task.

---

## 3) Pull Request Policy (Mandatory)

Every feature must go through a Pull Request.

Flow:

`feature branch -> PR -> develop`

### PR Requirements

- Clear description of what was done.
- Screenshots for UI changes.
- Related issue number (for traceability).
- Everyone in the team must approve before merge.
- No self-merge.

This can be enforced manually, even with free GitHub plans.

---

## 4) Commit Message Standard

Commits are validated by `.husky/commit-msg`, so follow this exact format:

`type(scope): description #ISSUE`

Or (scope optional):

`type: description #ISSUE`

### Required Commit Naming Rules

- Allowed `type`: `feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert`
- `scope` is optional, but if used must be lowercase (example: `api`, `ui`, `auth`)
- Description must be lowercase at start
- Description should not end with a period
- Subject length must be 10-72 characters
- Issue tag is required at the end: `#123` or `#AUTH123`

### Valid Examples

- `feat(api): add user authentication endpoint #AUTH123`
- `fix(ui): resolve button alignment issue #UI456`
- `docs: update api documentation #DOC789`
- `refactor(core): simplify error handling #TECH101`

This keeps history searchable, standardized, and compatible with our hooks.

---

## 5) Daily Sync Rule

Every day:

- Pull latest `develop`.
- Rebase or merge your branch properly.
- Avoid long-living feature branches.

Feature branches should be:

- Small in scope
- Merged within 1-3 days

---

## 6) Conflict Prevention Rule

Before pushing your feature branch:

```bash
git checkout develop
git pull origin develop
git checkout your-branch
git merge develop
```

Then:

1. Fix conflicts locally.
2. Test your changes.
3. Push your branch.

Never resolve merge conflicts using the GitHub web editor.

---

## 7) Contribution Transparency Rule

To avoid disputes, each task must have:

- Issue
- Branch
- Pull Request
- Commits

If someone modifies another person's branch:

- It must be documented, or
- Done through pair programming.

No force push without informing the team first.

Also note:

- Force push to protected branches is blocked by `.husky/pre-push`.
- Direct push to `main`, `develop`, and `staging` is blocked by `.husky/pre-push`.

---

## 8) Local Quality Gates (Husky Hooks)

Before each commit (`.husky/pre-commit`):

- `lint-staged` runs on staged files (formatting/linting)
- If lint/format fails, the commit is blocked
- Vulnerability check runs as warning (`npm run audit:check`) and does not block commit

Before each push (`.husky/pre-push`):

- Direct push to protected branches is blocked
- Force push to protected branches is blocked

---

## 9) Weekly Team Lead Review

The team lead should run a weekly review:

- Review PR history.
- Review merged features.
- Check commit contributions.

Use: GitHub -> Insights -> Contributors.

This makes contribution tracking objective and transparent.

---

## 10) Optional Professional Setup

Recommended additions:

- Add a `CODEOWNERS` file.
- Protect `main` branch.
- Require PR review before merging.

---

## 11) Recommended Workflow Summary

1. Create issue
2. Assign issue
3. Create feature branch
4. Work and commit using standard messages
5. Open PR
6. Review
7. Merge to `develop`
8. After testing, merge `develop` -> `main`

---
