import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const caseStudySchema = z.object({
  tag: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  client: z.string().optional().nullable(),
  overview: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  challenge: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  impact: z.string().optional().nullable(),
  metrics: z.array(z.any()).optional(),
  tech: z.array(z.string()).optional(),
  gradient: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  is_published: z.boolean().optional().default(true),
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
 * /api/case-studies:
 *   get:
 *     tags:
 *       - Case Studies
 *     summary: Returns a list of case studies
 *     description: Returns all case studies ordered by creation date descending
 *     parameters:
 *       - in: query
 *         name: is_published
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter case studies by published status
 *     responses:
 *       200:
 *         description: A list of case studies
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPublished = searchParams.get('is_published');
  
  try {
    const supabase = await createClient();
    
    let query = supabase.from('case_studies').select('*').order('created_at', { ascending: false });
    
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
 * /api/case-studies:
 *   post:
 *     tags:
 *       - Case Studies
 *     summary: Creates a new case study
 *     description: Creates a new case study with the provided details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               tag:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               client:
 *                 type: string
 *               overview:
 *                 type: string
 *               role:
 *                 type: string
 *               timeline:
 *                 type: string
 *               industry:
 *                 type: string
 *               challenge:
 *                 type: string
 *               solution:
 *                 type: string
 *               impact:
 *                 type: string
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: object
 *               tech:
 *                 type: array
 *                 items:
 *                   type: string
 *               gradient:
 *                 type: string
 *               accentColor:
 *                 type: string
 *               image:
 *                 type: string
 *               is_published:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: The created case study
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const json = await request.json();
    const result = caseStudySchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('case_studies')
      .insert([
        {
          tag: body.tag,
          title: body.title,
          description: body.description,
          client: body.client,
          overview: body.overview,
          role: body.role,
          timeline: body.timeline,
          industry: body.industry,
          challenge: body.challenge,
          solution: body.solution,
          impact: body.impact,
          metrics: body.metrics,
          tech: body.tech,
          gradient: body.gradient,
          accentColor: body.accentColor,
          image: body.image,
          is_published: body.is_published ?? true,
        }
      ])
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
