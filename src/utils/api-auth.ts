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
