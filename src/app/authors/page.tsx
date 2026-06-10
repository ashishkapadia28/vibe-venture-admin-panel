import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AuthorsManager from "@/components/AuthorsManager";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export default async function AuthorsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
        }
      },
    },
  });

  const { data: authors } = await supabase
    .from('authors')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
      <AuthorsManager initialAuthors={authors || []} />
    </div>
  );
}
