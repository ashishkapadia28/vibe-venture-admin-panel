import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  industry_id: z.string().uuid().optional().nullable(),
  is_published: z.boolean().optional().default(false),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     tags:
 *       - Blogs
 *     summary: Returns a list of blogs
 *     description: Returns all blogs ordered by creation date descending
 *     parameters:
 *       - in: query
 *         name: is_published
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter blogs by published status
 *     responses:
 *       200:
 *         description: A list of blogs
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPublished = searchParams.get('is_published');
  
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('blogs')
      .select('*, author:authors(name), industry:industries(name)')
      .order('created_at', { ascending: false });
    
    if (isPublished !== null) {
      query = query.eq('is_published', isPublished === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     tags:
 *       - Blogs
 *     summary: Creates a new blog
 *     description: Creates a new blog post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *               image_url:
 *                 type: string
 *               author_id:
 *                 type: string
 *               industry_id:
 *                 type: string
 *               is_published:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: The created blog
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const json = await request.json();
    const result = blogSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('blogs')
      .insert([
        {
          title: body.title,
          slug: body.slug,
          content: body.content,
          image_url: body.image_url,
          author_id: body.author_id || null,
          industry_id: body.industry_id || null,
          is_published: body.is_published ?? false,
        }
      ])
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0], { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
