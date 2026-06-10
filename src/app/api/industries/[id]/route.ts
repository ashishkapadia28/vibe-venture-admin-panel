import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const industryUpdateSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  icon_name: z.string().optional().nullable(),
  stats: z.array(z.any()).optional(),
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
 * /api/industries/{id}:
 *   get:
 *     tags:
 *       - Industries
 *     summary: Get an industry by ID or slug
 *     description: Returns a single industry based on the provided UUID or slug
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The industry ID or slug
 *     responses:
 *       200:
 *         description: The requested industry
 *       404:
 *         description: Industry not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from('industries').select('*');
    
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
 * /api/industries/{id}:
 *   put:
 *     tags:
 *       - Industries
 *     summary: Update an industry
 *     description: Updates an existing industry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The industry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               image_url:
 *                 type: string
 *               icon_name:
 *                 type: string
 *               stats:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: The updated industry
 *       404:
 *         description: Industry not found
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
    const result = industryUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.icon_name !== undefined) updates.icon_name = body.icon_name;
    if (body.stats !== undefined) updates.stats = body.stats;
    
    const { data, error } = await supabase
      .from('industries')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    if (data.length === 0) return NextResponse.json({ error: "Industry not found" }, { status: 404, headers: corsHeaders });
    
    return NextResponse.json(data[0], { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/industries/{id}:
 *   delete:
 *     tags:
 *       - Industries
 *     summary: Delete an industry
 *     description: Deletes an existing industry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The industry ID
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
      .from('industries')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
