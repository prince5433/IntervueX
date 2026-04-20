# components folder (Natural-Language Guide)

Yeh reusable UI building blocks ka ghar hai.

High-level split:
- ui/: base primitives (button, dialog, tabs, input, etc.)
- animate-ui/: animation-centric UI pieces
- feature components: CreditButton, AppointmentCard, FeedbackModal, PricingSection, etc.

Kaise padhein:
1. top-level feature components dekho (business context samajhne ke liye)
2. phir ui primitives dekho (design system samajhne ke liye)

Tip:
- Jo component server data chahta hai wo server component ho sakta hai (e.g. header).
- Jo hooks/state/useEffect use karega, wo client component hoga.
