import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { verifyTurnstileToken } from "@/utils/turnstile";
import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  country: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  project_info: z.string().min(1, "Project info is required"),
  cf_turnstile_response: z.string().min(1, "Captcha token is required").optional(),
});

/**
 * @swagger
 * /api/inquiries:
 *   get:
 *     tags:
 *       - Inquiries
 *     summary: Returns a list of inquiries
 *     description: Returns all inquiries ordered by creation date descending
 *     responses:
 *       200:
 *         description: A list of inquiries
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/inquiries:
 *   post:
 *     tags:
 *       - Inquiries
 *     summary: Creates a new inquiry
 *     description: Submits a new project inquiry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - project_info
 *               - cf_turnstile_response
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               country:
 *                 type: string
 *               industry:
 *                 type: string
 *               service:
 *                 type: string
 *               project_info:
 *                 type: string
 *               cf_turnstile_response:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created inquiry
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = inquirySchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400 });
    }
    const body = result.data;

    // Verify Turnstile Token
    if (body.cf_turnstile_response) {
      const isValid = await verifyTurnstileToken(body.cf_turnstile_response);
      if (!isValid) {
        return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 });
      }
    } else {
      // In production, you might want to strictly require this field:
      // return NextResponse.json({ error: "Captcha token is missing." }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('inquiries')
      .insert([
        {
          name: body.name,
          email: body.email,
          country: body.country,
          industry: body.industry,
          service: body.service,
          project_info: body.project_info,
          status: 'New'
        }
      ]);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true, message: "Inquiry submitted successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
