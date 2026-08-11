## Summary

Describe the problem and the smallest coherent solution.

## Scope

- [ ] Change is focused and avoids unrelated refactors.
- [ ] Public API / database / deployment impact is documented when applicable.

## Security and privacy

- [ ] Authorization was reviewed at the API boundary.
- [ ] No credentials, production exports, personal data, local databases, or diagnostic dumps are included.
- [ ] Tests and examples use synthetic or redacted data.

## Validation

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test:run`
- [ ] `pnpm build`

## Notes for maintainers

List migrations, rollout concerns, follow-up work, or known limitations.
