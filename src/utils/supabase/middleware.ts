import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');

  // Define public endpoints that allow anonymous POST requests
  const publicPostRoutes = [
    '/api/inquiries',
    '/api/applications',
    '/api/blogs/comments'
  ];
  const isPublicPost = request.method === 'POST' && publicPostRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && !isAuthRoute) {
    if (isApiRoute && request.method !== 'GET' && request.method !== 'OPTIONS' && !isPublicPost) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (isApiRoute && (request.method === 'GET' || request.method === 'OPTIONS' || isPublicPost)) {
      return supabaseResponse;
    }
    
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
