# lib folder (Natural-Language Guide)

Yeh project ka utility + infra backbone hai.

Major files:
- prisma.js: DB client singleton
- checkUser.js: Clerk user sync + monthly credits logic
- arcjet.js: reusable rate-limit helper
- helpers.js: date/time/slot utility
- data.js: constants, labels, plans
- utils.js: generic helpers

Tip:
- Feature flow samajhna ho to actions + lib files saath me padhna best hai.
