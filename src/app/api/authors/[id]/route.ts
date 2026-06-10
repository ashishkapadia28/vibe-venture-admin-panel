import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const authorUpdateSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
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
 * /api/authors/{id}:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Get an author by ID
 *     description: Returns a single author based on the provided ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The author ID
 *     responses:
 *       200:
 *         description: The requested author
 *       404:
 *         description: Author not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/authors/{id}:
 *   put:
 *     tags:
 *       - Authors
 *     summary: Update an author
 *     description: Updates an existing author by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The author ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated author
 *       404:
 *         description: Author not found
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
    const result = authorUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.bio !== undefined) updates.bio = body.bio;
    
    const { data, error } = await supabase
      .from('authors')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    if (data.length === 0) return NextResponse.json({ error: "Author not found" }, { status: 404, headers: corsHeaders });
    
    return NextResponse.json(data[0], { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/authors/{id}:
 *   delete:
 *     tags:
 *       - Authors
 *     summary: Delete an author
 *     description: Deletes an existing author by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The author ID
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
      .from('authors')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
