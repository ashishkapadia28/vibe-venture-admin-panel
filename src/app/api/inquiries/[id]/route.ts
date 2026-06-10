import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const inquiryUpdateSchema = z.object({
  status: z.string().min(1, "Status is required"),
});

/**
 * @swagger
 * /api/inquiries/{id}:
 *   get:
 *     tags:
 *       - Inquiries
 *     summary: Get an inquiry by ID
 *     description: Returns a single inquiry based on the provided ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The inquiry ID
 *     responses:
 *       200:
 *         description: The requested inquiry
 *       404:
 *         description: Inquiry not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('inquiries')
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
 * /api/inquiries/{id}:
 *   put:
 *     tags:
 *       - Inquiries
 *     summary: Update an inquiry status
 *     description: Updates an existing inquiry status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The inquiry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated inquiry
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
    const result = inquiryUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400 });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('inquiries')
      .update({
        status: body.status,
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/inquiries/{id}:
 *   delete:
 *     tags:
 *       - Inquiries
 *     summary: Delete an inquiry
 *     description: Deletes an existing inquiry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The inquiry ID
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
      .from('inquiries')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
