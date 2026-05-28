import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    const body = await request.json();
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

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
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
