import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { getApplicationsRateLimiter } from "@/utils/redis";
import { verifyTurnstile } from "@/utils/turnstile";
import { z } from "zod";

const applicationFieldsSchema = z.object({
  job_id: z.string().min(1, "Job ID is required"), // the job's public slug, e.g. "senior-frontend-engineer"
  name: z.string().min(1, "Name is required"),
  email: z.string()
    .email("Invalid email")
    .min(1, "Email is required")
    .refine((email) => email.toLowerCase().endsWith("@gmail.com"), {
      message: "Only Gmail addresses are accepted (name@gmail.com)",
    }),
  phone: z.string().min(1, "Phone is required"),
  linkedin: z.string().optional().nullable(),
  experience: z.string().min(1, "Experience level is required"),
});

const RESUMES_BUCKET = "resumes";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SIGNED_URL_TTL = 60 * 60; // 1 hour, for admin viewing

// Bot trap: the public form renders a field with this name, visually
// hidden from real applicants. A human never fills it; a bot's autofill
// usually does. Tripping it returns a fake success so the bot doesn't
// learn it was caught — nothing gets saved.
const HONEYPOT_FIELD = "website";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Best-effort client IP for the "you agree to our privacy policy" consent
// record. Behind Vercel/most reverse proxies the real client IP is the
// first entry in x-forwarded-for; direct connections fall back to x-real-ip.
const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
};

function validateFile(entry: FormDataEntryValue | null, label: string): { error: string } | { file: File } {
  if (!(entry instanceof File) || entry.size === 0) {
    return { error: `${label} is required` };
  }
  if (entry.type !== "application/pdf") {
    return { error: `${label} must be a PDF file` };
  }
  if (entry.size > MAX_FILE_SIZE) {
    return { error: `${label} exceeds the 5MB limit` };
  }
  return { file: entry };
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * @swagger
 * /api/applications:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Returns a list of applications
 *     description: >
 *       Returns all applications, optionally filtered by job ID (admin only).
 *       resume_url / cover_letter_url are short-lived (1 hour) signed links
 *       into the private "resumes" storage bucket, generated fresh per request.
 *     parameters:
 *       - in: query
 *         name: job_id
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter applications by the job's internal UUID
 *     responses:
 *       200:
 *         description: A list of applications
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');

  try {
    const supabase = await createClient();

    let query = supabase
      .from('job_applications')
      .select('*, job_posts(title)')
      .order('created_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows = data || [];

    // Turn stored storage paths into short-lived signed URLs the admin
    // panel can actually open (the bucket is private).
    const paths = Array.from(
      new Set(
        rows.flatMap((r) => [r.resume_path, r.cover_letter_path]).filter((p): p is string => !!p)
      )
    );

    let signedUrlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed, error: signError } = await supabase.storage
        .from(RESUMES_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL);
      if (!signError && signed) {
        signedUrlByPath = new Map(
          signed
            .filter((s): s is typeof s & { path: string; signedUrl: string } => !s.error && !!s.path && !!s.signedUrl)
            .map((s) => [s.path, s.signedUrl])
        );
      }
    }

    const withUrls = rows.map((r) => ({
      ...r,
      resume_url: r.resume_path ? signedUrlByPath.get(r.resume_path) || null : null,
      cover_letter_url: r.cover_letter_path ? signedUrlByPath.get(r.cover_letter_path) || null : null,
    }));

    return NextResponse.json(withUrls);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/applications:
 *   post:
 *     tags:
 *       - Applications
 *     summary: Creates a new application
 *     description: >
 *       Creates a new job application. multipart/form-data, not JSON — resume
 *       and cover_letter are uploaded as PDF files (max 5MB each) directly to
 *       this endpoint. job_id is the job's public slug (the "id" field
 *       returned by GET /api/jobs), not the internal UUID.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - job_id
 *               - name
 *               - email
 *               - phone
 *               - experience
 *               - resume
 *               - cover_letter
 *             properties:
 *               job_id:
 *                 type: string
 *                 description: The job's slug, e.g. "senior-frontend-engineer"
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               experience:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *               cover_letter:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: The created application
 *       400:
 *         description: Validation failed, job_id does not match a live job, or a file is missing/invalid
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limit first — cheapest possible check, protects everything
    // downstream from being hammered. Fails open if Redis isn't configured.
    const limiter = getApplicationsRateLimiter();
    if (limiter) {
      const { success, reset } = await limiter.limit(clientIp || "unknown");
      if (!success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return NextResponse.json(
          { error: "Too many applications from this connection. Please try again later." },
          { status: 429, headers: { ...corsHeaders, "Retry-After": String(retryAfterSeconds) } }
        );
      }
    }

    const formData = await request.formData();

    // Honeypot — a filled-in hidden field means a bot, not a person.
    // Return a normal-looking success without saving anything.
    if (typeof formData.get(HONEYPOT_FIELD) === "string" && (formData.get(HONEYPOT_FIELD) as string).length > 0) {
      return NextResponse.json(
        { success: true, application_id: crypto.randomUUID(), message: "Application submitted successfully" },
        { status: 201, headers: corsHeaders }
      );
    }

    // Cloudflare Turnstile — verifies a real browser/human submitted this.
    // No-op (passes) if TURNSTILE_SECRET_KEY isn't set.
    const turnstileOk = await verifyTurnstile(formData.get("cf_turnstile_token") as string | null, clientIp);
    if (!turnstileOk) {
      return NextResponse.json({ error: "Verification failed. Please retry the form." }, { status: 400, headers: corsHeaders });
    }

    const fields = applicationFieldsSchema.safeParse({
      job_id: formData.get("job_id"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      linkedin: formData.get("linkedin"),
      experience: formData.get("experience"),
    });

    if (!fields.success) {
      return NextResponse.json({ error: "Validation failed", details: fields.error.issues }, { status: 400, headers: corsHeaders });
    }
    const body = fields.data;

    const resumeCheck = validateFile(formData.get("resume"), "Resume");
    if ("error" in resumeCheck) {
      return NextResponse.json({ error: resumeCheck.error }, { status: 400, headers: corsHeaders });
    }
    const coverLetterCheck = validateFile(formData.get("cover_letter"), "Cover letter");
    if ("error" in coverLetterCheck) {
      return NextResponse.json({ error: coverLetterCheck.error }, { status: 400, headers: corsHeaders });
    }

    const supabase = await createClient();

    // job_id from the public site is the job's slug — resolve it to the
    // real job record so we can check it's still open and get its UUID.
    const { data: job, error: jobLookupError } = await supabase
      .from('job_posts')
      .select('id, is_active')
      .eq('slug', body.job_id)
      .maybeSingle();

    if (jobLookupError) throw jobLookupError;

    if (!job) {
      return NextResponse.json({ error: "Invalid job_id: no matching job found" }, { status: 400, headers: corsHeaders });
    }
    if (!job.is_active) {
      return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400, headers: corsHeaders });
    }

    const folder = `${Date.now()}_${body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}`;
    const resumePath = `${folder}/resume.pdf`;
    const coverLetterPath = `${folder}/cover-letter.pdf`;

    const { error: resumeUploadError } = await supabase.storage
      .from(RESUMES_BUCKET)
      .upload(resumePath, resumeCheck.file, { contentType: "application/pdf", upsert: false });
    if (resumeUploadError) throw resumeUploadError;

    const { error: coverLetterUploadError } = await supabase.storage
      .from(RESUMES_BUCKET)
      .upload(coverLetterPath, coverLetterCheck.file, { contentType: "application/pdf", upsert: false });
    if (coverLetterUploadError) {
      // Don't leave an orphaned resume behind if the second upload fails.
      await supabase.storage.from(RESUMES_BUCKET).remove([resumePath]);
      throw coverLetterUploadError;
    }

    // Generate the id ourselves rather than .select()-ing it back after
    // insert: anonymous applicants can INSERT (by RLS policy) but not
    // SELECT job_applications — reading their own row back would need a
    // SELECT grant that'd let anon read *everyone's* applications too.
    const applicationId = crypto.randomUUID();

    const { error } = await supabase
      .from('job_applications')
      .insert([
        {
          id: applicationId,
          job_id: job.id,
          name: body.name,
          email: body.email,
          phone: body.phone,
          linkedin: body.linkedin || null,
          experience: body.experience,
          resume_path: resumePath,
          cover_letter_path: coverLetterPath,
          status: 'In Review', // Default status for new applications
          ip_address: clientIp, // consent record for the privacy-policy checkbox
          // created_at is stamped server-side by the DB default (now()) —
          // that's the submission timestamp for the same consent record.
        }
      ]);

    if (error) {
      // Insert failed after upload succeeded — clean up the orphaned files.
      await supabase.storage.from(RESUMES_BUCKET).remove([resumePath, coverLetterPath]);
      throw error;
    }

    return NextResponse.json(
      { success: true, application_id: applicationId, message: "Application submitted successfully" },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
