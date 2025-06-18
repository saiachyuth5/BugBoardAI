import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type BugStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';

interface UpdateBugData {
  status?: BugStatus;
  bounty?: number;
  resolved_at?: string | null;
  fix_url?: string | null;
  fix_explanation?: string | null;
}

// GET /api/admin/bugs/[id] - Get a single bug
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: bug, error } = await supabase
      .from('bugs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Bug not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(bug);
  } catch (error) {
    console.error(`Error fetching bug:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch bug' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/bugs/[id] - Update a bug
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates: UpdateBugData = await request.json();
    
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If status is being updated to 'resolved', set resolved_at
    if (updates.status === 'resolved' && !updates.resolved_at) {
      updates.resolved_at = new Date().toISOString();
    }

    const { data: updatedBug, error } = await supabase
      .from('bugs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating bug ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to update bug' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedBug);
  } catch (error) {
    console.error(`Error updating bug:`, error);
    return NextResponse.json(
      { error: 'Failed to update bug' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/bugs/[id] - Delete a bug
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, check if the bug exists
    const { data: bug, error: fetchError } = await supabase
      .from('bugs')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Bug not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Delete the bug
    const { error: deleteError } = await supabase
      .from('bugs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting bug:`, error);
    return NextResponse.json(
      { error: 'Failed to delete bug' },
      { status: 500 }
    );
  }
}
