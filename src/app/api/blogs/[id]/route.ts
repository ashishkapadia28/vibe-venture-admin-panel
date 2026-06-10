import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const blogUpdateSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  industry_id: z.string().uuid().optional().nullable(),
  is_published: z.boolean().optional(),
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
 * /api/blogs/{id}:
 *   get:
 *     tags:
 *       - Blogs
 *     summary: Get a blog by ID or slug
 *     description: Returns a single blog based on the provided UUID or slug
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog ID or slug
 *     responses:
 *       200:
 *         description: The requested blog
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    
    // Check if ID is a UUID (standard format) or a slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase
      .from('blogs')
      .select('*, author:authors(name), industry:industries(name)');
      
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }
      
    const { data, error } = await query.single();
      
    if (error) throw error;
    
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     tags:
 *       - Blogs
 *     summary: Update a blog
 *     description: Updates an existing blog post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: The updated blog
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const params = await props.params;
    const { id } = params;
    const json = await request.json();
    const result = blogUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.content !== undefined) updates.content = body.content;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.author_id !== undefined) updates.author_id = body.author_id || null;
    if (body.industry_id !== undefined) updates.industry_id = body.industry_id || null;
    if (body.is_published !== undefined) updates.is_published = body.is_published;
    
    const { data, error } = await supabase
      .from('blogs')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    if (data.length === 0) return NextResponse.json({ error: "Blog not found" }, { status: 404, headers: corsHeaders });
    
    return NextResponse.json(data[0], { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     tags:
 *       - Blogs
 *     summary: Delete a blog
 *     description: Deletes an existing blog by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog ID
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
