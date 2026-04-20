# actions folder (Natural-Language Guide)

Yahaan saari Server Actions rakhi gayi hain.

Simple language mein:
- Yeh functions browser se trigger hote hain, lekin execute server par hote hain.
- Database read/write, auth check, rate limit, transaction jaise kaam yahin handle hote hain.

Flow samajhne ka order:
1. onboarding.js: user role setup
2. explore.js: interviewer listing
3. booking.js: booking + credits + stream call create
4. call.js: call join token + authorization
5. appointments.js: interviewee appointment history
6. dashboard.js: interviewer dashboard data + withdrawal request
7. payout.js: admin payout approval
8. aiQuestions.jsx: interviewer AI question generator
9. user.js: current user profile snapshot

Tip:
- Agar feature bug ho raha ho, pehle action file mein validation aur DB query check karo.
