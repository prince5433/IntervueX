# app folder (Natural-Language Guide)

Yeh Next.js App Router ka core folder hai.

Is folder mein 3 major cheezein hoti hain:
- Route pages (URL mapping)
- Layouts (shared wrappers)
- API routes (webhooks/handlers)

Structure samajho:
- (auth): sign-in/sign-up screens
- (main): actual product flows (explore, booking, calls, dashboard)
- api/webhooks: external services ke callbacks (Stream events)

Important:
- Har page default server component hota hai jab tak use client na likha ho.
- Jo heavy business logic chahiye, wo actions/ mein rehta hai.
