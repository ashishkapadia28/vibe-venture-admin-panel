import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const authorSchema = z.object({
  name: z.string().min(1, "Name is required"),
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
 * /api/authors:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Returns a list of authors
 *     description: Returns all authors ordered by creation date descending
 *     responses:
 *       200:
 *         description: A list of authors
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('authors')
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
 * /api/authors:
 *   post:
 *     tags:
 *       - Authors
 *     summary: Creates a new author
 *     description: Creates a new author with the provided details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created author
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const json = await request.json();
    const result = authorSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('authors')
      .insert([
        {
          name: body.name,
          avatar_url: body.avatar_url,
          bio: body.bio,
        }
      ])
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0], { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
