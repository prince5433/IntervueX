/*
 * File Overview:
 * Use Case: Call room bootstrap data server side fetch karke client room component ko pass karta hai.
 * Project Role: Secure call entry guard + token handoff boundary hai.
 * Trigger: Specific call URL open hone par.
 * File Path: app/(main)/call/[callId]/page.jsx
 */
import { redirect, notFound } from "next/navigation";
import { getCallData } from "@/actions/call";
import CallRoom from "./_components/CallRoom";

export default async function CallPage({ params }) {
  const { callId } = await params;

  const result = await getCallData(callId);

  if (result.error === "Unauthorized") {
    redirect("/");
  }
  if (result.error === "Call not found") {
    notFound();
  }
  if (result.error === "Forbidden") {
    redirect("/");
  }

  const { token, isInterviewer, currentUser, booking } = result;
  return (
    <CallRoom
      callId={callId}
      token={token}
      apiKey={process.env.NEXT_PUBLIC_STREAM_API_KEY}
      currentUser={currentUser}
      booking={booking}
      isInterviewer={isInterviewer}
    />
  );
}
