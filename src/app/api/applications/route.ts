import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');
  
  try {
    const supabase = await createClient();
    
    let query = supabase.from('job_applications').select('*').order('created_at', { ascending: false });
    
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('job_applications')
      .insert([
        {
          job_id: body.job_id,
          name: body.name,
          email: body.email,
          phone: body.phone,
          linkedin: body.linkedin,
          experience: body.experience,
          cover_letter: body.cover_letter || null,
          status: 'In Review', // Default status for new applications
        }
      ])
      .select();
      
    if (error) throw error;
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
