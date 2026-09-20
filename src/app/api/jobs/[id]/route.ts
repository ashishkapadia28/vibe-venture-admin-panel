import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { cacheDel, PUBLIC_JOBS_CACHE_KEY } from "@/utils/redis";
import { z } from "zod";

const JOB_TYPES = ["Full-Time", "Contract", "Internship"] as const;
const JOB_EXPERIENCE_LEVELS = ["Fresher", "Mid-Level", "Experienced"] as const;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const jobUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  type: z.enum(JOB_TYPES).optional(),
  experience: z.enum(JOB_EXPERIENCE_LEVELS).optional(),
  is_active: z.boolean().optional(),
  description: z.string().optional().nullable(),
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get a job by ID
 *     description: Returns a single job posting based on the provided ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID
 *     responses:
 *       200:
 *         description: The requested job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     tags:
 *       - Jobs
 *     summary: Update a job
 *     description: Updates an existing job posting by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID
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
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Full-Time, Contract, Internship]
 *               experience:
 *                 type: string
 *                 enum: [Fresher, Mid-Level, Experienced]
 *               is_active:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated job
 *       500:
 *         description: Internal server error
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const json = await request.json();
    const result = jobUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400 });
    }
    const body = result.data;
    const supabase = await createClient();

    const updates: Record<string, unknown> = {
      title: body.title,
      department: body.department,
      location: body.location,
      type: body.type,
      experience: body.experience,
      is_active: body.is_active,
      description: body.description,
    };
    if (body.slug !== undefined) {
      const slug = slugify(body.slug);
      if (!slug) {
        return NextResponse.json({ error: "Could not derive a valid slug" }, { status: 400 });
      }
      updates.slug = slug;
    }

    const { data, error } = await supabase
      .from('job_posts')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "A job with this slug already exists" }, { status: 400 });
      }
      throw error;
    }

    await cacheDel(PUBLIC_JOBS_CACHE_KEY); // status/slug/etc. may have changed — don't serve a stale public list

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     tags:
 *       - Jobs
 *     summary: Delete a job
 *     description: Deletes an existing job posting by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('job_posts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;

    await cacheDel(PUBLIC_JOBS_CACHE_KEY);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
