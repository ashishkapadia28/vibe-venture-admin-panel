import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import BlogsManager from "@/components/BlogsManager";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export default async function BlogsPage() {
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

  // Fetch blogs with related author and industry names
  const { data: blogs } = await supabase
    .from('blogs')
    .select(`
      *,
      author:authors(name),
      industry:industries(name)
    `)
    .order('created_at', { ascending: false });

  const { data: authors } = await supabase.from('authors').select('id, name');
  const { data: industries } = await supabase.from('industries').select('id, name');

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-gray-50/50">
      <BlogsManager 
        initialBlogs={blogs || []} 
        authors={authors || []}
        industries={industries || []}
      />
    </div>
  );
}
