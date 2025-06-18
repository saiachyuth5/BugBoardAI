import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/admin/users - List users with pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to manage users
    const { data: hasPermission } = await supabase.rpc('has_permission', {
      user_id: session.user.id,
      permission_name: 'manage_users'
    });
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build the query
    let query = supabase
      .from('users')
      .select('*, roles:user_roles(role:roles(*))', { count: 'exact' });
    
    // Apply search if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,raw_user_meta_data->>'full_name'.ilike.%${search}%`);
    }
    
    // Execute the query with pagination
    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    // Transform the data to flatten the roles
    const transformedUsers = users.map(user => ({
      ...user,
      roles: (user.roles as any)?.map((r: any) => r.role) || []
    }));
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
    
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: Request) {
  try {
    const { email, password, full_name, role_ids } = await request.json();
    
    if (!email || !password || !full_name || !Array.isArray(role_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to create users
    const { data: hasPermission } = await supabase.rpc('has_permission', {
      user_id: session.user.id,
      permission_name: 'manage_users'
    });
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name },
    });
    
    if (authError) {
      console.error('Error creating user:', authError);
      throw authError;
    }
    
    const userId = authData.user.id;
    
    // Assign roles to the user
    if (role_ids.length > 0) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(role_ids.map((roleId: string) => ({
          user_id: userId,
          role_id: roleId,
        })));
      
      if (roleError) {
        console.error('Error assigning roles:', roleError);
        throw roleError;
      }
    }
    
    // Get the created user with roles
    const { data: createdUser } = await supabase
      .from('users')
      .select('*, roles:user_roles(role:roles(*))')
      .eq('id', userId)
      .single();
    
    return NextResponse.json({
      ...createdUser,
      roles: (createdUser?.roles as any)?.map((r: any) => r.role) || []
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
