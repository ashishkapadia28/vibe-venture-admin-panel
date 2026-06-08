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

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
