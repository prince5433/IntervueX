# prisma folder (Natural-Language Guide)

Database schema aur migration history yahin maintain hoti hai.

Files:
- schema.prisma: single source of truth for DB models/enums
- migrations/: schema changes ka timeline
- seed.js: test/demo data push helper

Important:
- Schema change ke baad migrate + generate dono run karna padta hai.
