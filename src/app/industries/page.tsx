import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import IndustriesManager from "@/components/IndustriesManager";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export default async function IndustriesPage() {
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

  const { data: industries } = await supabase
    .from('industries')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
      <IndustriesManager initialIndustries={industries || []} />
    </div>
  );
}
