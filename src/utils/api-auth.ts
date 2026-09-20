import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function checkAuth() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to access this endpoint." },
      { status: 401 }
    );
  }

  return null; // Null means authorized
}

/**
 * Non-blocking auth check. Unlike checkAuth(), this never returns a 401 —
 * it just tells the caller whether the request carries a valid admin
 * session, so a single endpoint can serve a richer shape to the admin
 * dashboard and a public-safe shape to anonymous/cross-origin callers.
 */
export async function isAuthed() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}
