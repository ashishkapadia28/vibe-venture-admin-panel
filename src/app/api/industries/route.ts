import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const industrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
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
 * /api/industries:
 *   get:
 *     tags:
 *       - Industries
 *     summary: Returns a list of industries
 *     description: Returns all industries ordered by creation date descending
 *     responses:
 *       200:
 *         description: A list of industries
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/industries:
 *   post:
 *     tags:
 *       - Industries
 *     summary: Creates a new industry
 *     description: Creates a new industry with the provided details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
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
 *       201:
 *         description: The created industry
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const json = await request.json();
    const result = industrySchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    
    const body = result.data;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('industries')
      .insert([
        {
          name: body.name,
          slug: body.slug,
          description: body.description,
          image_url: body.image_url,
          icon_name: body.icon_name || 'Building2',
          stats: body.stats || [],
        }
      ])
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0], { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
