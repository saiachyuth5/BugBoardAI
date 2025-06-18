import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total number of bugs
    const { count: totalBugs } = await supabase
      .from('bugs')
      .select('*', { count: 'exact', head: true });

    // Get open bugs count
    const { count: openBugs } = await supabase
      .from('bugs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get in-progress bugs count
    const { count: inProgressBugs } = await supabase
      .from('bugs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    // Get resolved bugs count
    const { count: resolvedBugs } = await supabase
      .from('bugs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    // Get total bounty amount
    const { data: bountyData, error: bountyError } = await supabase
      .from('bugs')
      .select('bounty')
      .not('bounty', 'is', null);

    const totalBounty = bountyData?.reduce((sum, bug) => sum + (bug.bounty || 0), 0) || 0;

    // Get recent bugs
    const { data: recentBugs } = await supabase
      .from('bugs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalBugs: totalBugs || 0,
      openBugs: openBugs || 0,
      inProgressBugs: inProgressBugs || 0,
      resolvedBugs: resolvedBugs || 0,
      totalBounty,
      recentBugs: recentBugs || [],
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
