import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  description: z.string().optional().nullable(),
});

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Returns a list of jobs
 *     description: Returns all job postings ordered by creation date descending
 *     parameters:
 *       - in: query
 *         name: is_active
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter jobs by active status
 *     responses:
 *       200:
 *         description: A list of jobs
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get('is_active');
  
  try {
    const supabase = await createClient();
    
    let query = supabase.from('job_posts').select('*').order('created_at', { ascending: false });
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Creates a new job
 *     description: Creates a new job posting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *               experience:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created job
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const json = await request.json();
    const result = jobSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400 });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('job_posts')
      .insert([
        {
          title: body.title,
          department: body.department,
          location: body.location,
          type: body.type,
          experience: body.experience,
          is_active: body.is_active ?? true,
          description: body.description || null,
        }
      ])
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
