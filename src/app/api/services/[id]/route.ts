import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const serviceUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
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
 * /api/services/{id}:
 *   get:
 *     tags:
 *       - Services
 *     summary: Get a service by ID
 *     description: Returns a single service based on the provided ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     responses:
 *       200:
 *         description: The requested service
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('services')
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
 * /api/services/{id}:
 *   put:
 *     tags:
 *       - Services
 *     summary: Update a service
 *     description: Updates an existing service by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image_url:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The updated service
 *       404:
 *         description: Service not found
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
    const result = serviceUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    if (data.length === 0) return NextResponse.json({ error: "Service not found" }, { status: 404, headers: corsHeaders });
    
    return NextResponse.json(data[0], { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     tags:
 *       - Services
 *     summary: Delete a service
 *     description: Deletes an existing service by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
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
      .from('services')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
