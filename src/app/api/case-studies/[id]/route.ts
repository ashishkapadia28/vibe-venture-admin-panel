import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const caseStudyUpdateSchema = z.object({
  tag: z.string().optional().nullable(),
  title: z.string().optional(),
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
 * /api/case-studies/{id}:
 *   put:
 *     tags:
 *       - Case Studies
 *     summary: Update a case study
 *     description: Updates an existing case study by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The case study ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: The updated case study
 *       404:
 *         description: Case study not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const params = await props.params;
    const id = params.id;
    const json = await request.json();
    const result = caseStudyUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();
    
    // Create an object with only the fields that are provided
    const updates: any = {};
    if (body.tag !== undefined) updates.tag = body.tag;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.metrics !== undefined) updates.metrics = body.metrics;
    if (body.tech !== undefined) updates.tech = body.tech;
    if (body.gradient !== undefined) updates.gradient = body.gradient;
    if (body.accentColor !== undefined) updates.accentColor = body.accentColor;
    if (body.image !== undefined) updates.image = body.image;
    if (body.is_published !== undefined) updates.is_published = body.is_published;
    if (body.client !== undefined) updates.client = body.client;
    if (body.overview !== undefined) updates.overview = body.overview;
    if (body.role !== undefined) updates.role = body.role;
    if (body.timeline !== undefined) updates.timeline = body.timeline;
    if (body.industry !== undefined) updates.industry = body.industry;
    if (body.challenge !== undefined) updates.challenge = body.challenge;
    if (body.solution !== undefined) updates.solution = body.solution;
    if (body.impact !== undefined) updates.impact = body.impact;
    const { data, error } = await supabase
      .from('case_studies')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    if (data.length === 0) {
      return NextResponse.json({ error: "Case study not found" }, { status: 404, headers: corsHeaders });
    }
    
    return NextResponse.json(data[0], { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/case-studies/{id}:
 *   delete:
 *     tags:
 *       - Case Studies
 *     summary: Delete a case study
 *     description: Deletes an existing case study by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The case study ID
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
    const id = params.id;
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ message: "Case study deleted successfully" }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
