import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type BugStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';

// GET /api/admin/bugs - Get all bugs with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as BugStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('bugs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bugs, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(bugs || []);
  } catch (error) {
    console.error('Error fetching bugs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bugs' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/bugs - Update multiple bugs
export async function PATCH(request: Request) {
  try {
    const updates = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Expected an array of updates' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process each update
    const results = await Promise.all(
      updates.map(async (update) => {
        const { id, ...updates } = update;
        const { data, error } = await supabase
          .from('bugs')
          .update(updates)
          .eq('id', id)
          .select();
        
        if (error) {
          console.error(`Error updating bug ${id}:`, error);
          return { id, success: false, error: error.message };
        }
        
        return { id, success: true, data };
      })
    );

    // Check if all updates were successful
    const failedUpdates = results.filter(r => !r.success);
    if (failedUpdates.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Some updates failed',
          failedUpdates,
          totalUpdates: updates.length,
          successfulUpdates: results.length - failedUpdates.length
        },
        { status: 207 } // Multi-status
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All updates successful',
      totalUpdates: updates.length 
    });
  } catch (error) {
    console.error('Error updating bugs:', error);
    return NextResponse.json(
      { error: 'Failed to update bugs' },
      { status: 500 }
    );
  }
}
