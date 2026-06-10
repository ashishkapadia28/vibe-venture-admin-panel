import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/api-auth";
import { z } from "zod";

const settingsUpdateSchema = z.object({
  maintenance_mode: z.boolean().optional(),
});

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Get site settings
 *     description: Returns the global site settings (e.g. maintenance mode)
 *     responses:
 *       200:
 *         description: The site settings
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .single();
      
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/settings:
 *   put:
 *     tags:
 *       - Settings
 *     summary: Update site settings
 *     description: Updates the global site settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maintenance_mode:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The updated settings
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: Request) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const json = await request.json();
    const result = settingsUpdateSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.issues }, { status: 400 });
    }
    const body = result.data;
    const supabase = await createClient();
    
    const updates: any = {};
    if (body.maintenance_mode !== undefined) updates.maintenance_mode = body.maintenance_mode;
    
    const { data, error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', 'global')
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
