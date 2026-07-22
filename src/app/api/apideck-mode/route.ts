import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasApideckCreds } from "@/lib/apideckServer";

// Reports two things to the UI:
//   - live_available: whether APIDECK_API_KEY + APIDECK_APP_ID are configured
//                     (i.e. whether Live can be enabled at all)
//   - mode:           the effective mode for the current request, factoring in
//                     the user's `apideck-mode` cookie preference
export async function GET() {
  const live = hasApideckCreds();
  const pref = cookies().get("apideck-mode")?.value; // "mock" | undefined
  const mode: "live" | "mock" = live && pref !== "mock" ? "live" : "mock";
  return NextResponse.json({ mode, live_available: live });
}
