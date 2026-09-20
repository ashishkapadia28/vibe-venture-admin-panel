import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth, isAuthed } from "@/utils/api-auth";
import { cacheGet, cacheSet, cacheDel, PUBLIC_JOBS_CACHE_KEY, PUBLIC_JOBS_CACHE_TTL_SECONDS } from "@/utils/redis";
import { z } from "zod";

const JOB_TYPES = ["Full-Time", "Contract", "Internship"] as const;
const JOB_EXPERIENCE_LEVELS = ["Fresher", "Mid-Level", "Experienced"] as const;

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  type: z.enum(JOB_TYPES, { message: `Type must be one of: ${JOB_TYPES.join(", ")}` }),
  experience: z.enum(JOB_EXPERIENCE_LEVELS, { message: `Experience must be one of: ${JOB_EXPERIENCE_LEVELS.join(", ")}` }),
  is_active: z.boolean().optional().default(true),
  description: z.string().optional().nullable(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

interface PublicJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Returns a list of jobs
 *     description: >
 *       Public (unauthenticated) callers only ever see published jobs
 *       (is_active = true), shaped for the careers page:
 *       { id (slug), title, department, location, type, experience }.
 *       Authenticated admin sessions get the full internal record
 *       (real UUID id, description, is_active, timestamps, slug) and can
 *       optionally filter with the is_active query param.
 *     parameters:
 *       - in: query
 *         name: is_active
 *         required: false
 *         schema:
 *           type: boolean
 *         description: (Admin sessions only) Filter jobs by active status
 *     responses:
 *       200:
 *         description: A list of jobs
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const admin = await isAuthed();

    // Public branch only — this is the one every career-page pageview
    // hits, and it's identical for every anonymous visitor, so it's the
    // one worth caching. Admin's view (full fields, is_active filter)
    // always reads live so the dashboard never shows stale data.
    if (!admin) {
      const cached = await cacheGet<PublicJob[]>(PUBLIC_JOBS_CACHE_KEY);
      if (cached) {
        return NextResponse.json(cached, { headers: { ...corsHeaders, "X-Cache": "HIT" } });
      }
    }

    const supabase = await createClient();
    let query = supabase.from('job_posts').select('*').order('created_at', { ascending: false });

    if (admin) {
      const isActive = searchParams.get('is_active');
      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true');
      }
    } else {
      // Public career page must never see hidden/closed listings.
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (admin) {
      return NextResponse.json(data, { headers: corsHeaders });
    }

    // Public shape: the site's "id" is our slug (that's what becomes
    // /career/{id} and what gets sent back as job_id on apply).
    const publicJobs: PublicJob[] = (data || []).map((job) => ({
      id: job.slug,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      experience: job.experience,
    }));

    await cacheSet(PUBLIC_JOBS_CACHE_KEY, publicJobs, PUBLIC_JOBS_CACHE_TTL_SECONDS);

    return NextResponse.json(publicJobs, { headers: { ...corsHeaders, "X-Cache": "MISS" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Creates a new job
 *     description: Creates a new job posting. slug is auto-generated from the title if omitted.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - department
 *               - location
 *               - type
 *               - experience
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *                 description: URL-safe identifier used as /career/{slug}. Auto-generated from title if omitted.
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
 *       201:
 *         description: The created job
 *       400:
 *         description: Validation failed, or slug already in use
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
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = result.data;
    const supabase = await createClient();

    const slug = body.slug ? slugify(body.slug) : slugify(body.title);
    if (!slug) {
      return NextResponse.json({ error: "Could not derive a valid slug from the title" }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from('job_posts')
      .insert([
        {
          title: body.title,
          slug,
          department: body.department,
          location: body.location,
          type: body.type,
          experience: body.experience,
          is_active: body.is_active ?? true,
          description: body.description || null,
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `A job with slug "${slug}" already exists` }, { status: 400, headers: corsHeaders });
      }
      throw error;
    }

    await cacheDel(PUBLIC_JOBS_CACHE_KEY); // new job — don't make the career page wait out the TTL

    return NextResponse.json(data[0], { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
