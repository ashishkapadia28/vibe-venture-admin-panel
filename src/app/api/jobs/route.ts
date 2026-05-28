import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
