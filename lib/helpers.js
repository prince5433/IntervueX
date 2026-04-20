/*
 * File Overview:
 * Use Case: Date/time formatting aur slot-generation jaise deterministic helpers provide karta hai.
 * Project Role: Scheduling UI aur appointment presentation ko predictable aur reusable banata hai.
 * Typical Trigger: Booking, cards, dashboard timing views me helper calls hoti hain.
 * File Path: lib/helpers.js
 */
import {
  format,
  isToday,
  isTomorrow,
  addDays,
  addMinutes,
  isBefore,
  isAfter,
  set,
  differenceInMinutes,
} from "date-fns";

// "Mon, Mar 24, 2026" — used in appointment cards
export function formatDate(iso) {
  return format(new Date(iso), "EEE, MMM d, yyyy");
}

// "Monday, March 24, 2026" — used in the booking confirm card
export function formatDateFull(date) {
  return format(new Date(date), "EEEE, MMMM d, yyyy");
}

// "9:30 AM" — used anywhere a time-only string is needed (slot buttons, appointment rows)
export function formatTime(date) {
  return format(new Date(date), "h:mm a");
}

// "1h 30m" or "45m" — used in appointment cards to show session length
export function formatDuration(start, end) {
  // Note: yahan duration minute diff se nikal ke human readable banate hain (e.g. 1h 30m).
  const mins = differenceInMinutes(new Date(end), new Date(start));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

// Returns { top, bottom } label for each date tab in SlotPicker.
// Today/Tomorrow get friendly labels; all other days show short weekday name.
// bottom is always "MMM d" (e.g. "Mar 24") regardless of which branch.
export function formatDateTab(date) {
  const bottom = format(date, "MMM d");
  if (isToday(date)) return { top: "Today", bottom };
  if (isTomorrow(date)) return { top: "Tomorrow", bottom };
  return { top: format(date, "EEE"), bottom };
}

// Produces an array of Date objects starting from today, one per day,
// for the next `daysAhead` days — used to populate the date tab strip.
export function generateDates(daysAhead) {
  // Note: today se start karke next N din ka array create hota hai (tab strip ke liye).
  return Array.from({ length: daysAhead }, (_, i) => addDays(new Date(), i));
}

// Splits an interviewer's daily availability window into fixed-length slots
// and marks each one as booked or available.
//
// - date:                the calendar day to generate slots for
// - availStartTime:      the stored availability start (only hours/minutes are used)
// - availEndTime:        the stored availability end (only hours/minutes are used)
// - bookedSlots:         existing SCHEDULED bookings to check for conflicts
// - slotDurationMinutes: length of each slot (45 min throughout the app)
//
// Past slots (cursor <= now) are skipped entirely so they never appear in the UI.
// A slot is marked isBooked if it overlaps any existing booking using a standard
// overlap check: slotStart < bookedEnd && slotEnd > bookedStart.
export function generateSlots(
  date,
  availStartTime,
  availEndTime,
  bookedSlots,
  slotDurationMinutes
) {
  // Note: availability time-of-day ko selected date par stamp karte hain,
  // tabhi ek din specific slot matrix ban paati hai.
  console.log(availStartTime, availEndTime, bookedSlots);

  const avStart = new Date(availStartTime);
  const avEnd = new Date(availEndTime);

  // Apply the availability hours/minutes onto the target calendar day
  const start = set(new Date(date), {
    hours: avStart.getHours(),
    minutes: avStart.getMinutes(),
    seconds: 0,
    milliseconds: 0,
  });

  const end = set(new Date(date), {
    hours: avEnd.getHours(),
    minutes: avEnd.getMinutes(),
    seconds: 0,
    milliseconds: 0,
  });

  const now = new Date();
  const slots = [];
  let cursor = start;

  while (isBefore(cursor, end)) {
    const slotEnd = addMinutes(cursor, slotDurationMinutes);

    // Drop the last partial slot if it would overflow the window
    if (isAfter(slotEnd, end)) break;

    // overlap check:
    // slot start booked-end se pehle ho AND slot end booked-start ke baad ho => overlap true.
    const isBooked = bookedSlots.some(
      (b) =>
        isBefore(cursor, new Date(b.endTime)) &&
        isAfter(slotEnd, new Date(b.startTime))
    );

    // Only push future slots — past ones are silently skipped
    // Note: user ko sirf actionable slots dikhane ke liye past slots drop karte hain.
    if (isAfter(cursor, now)) {
      slots.push({
        startTime: cursor,
        endTime: slotEnd,
        isBooked,
        available: !isBooked,
      });
    }

    cursor = slotEnd;
  }

  return slots;
}
