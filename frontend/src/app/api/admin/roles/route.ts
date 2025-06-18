import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/admin/roles - List all roles
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to manage roles
    const { data: hasPermission } = await supabase.rpc('has_permission', {
      user_id: session.user.id,
      permission_name: 'manage_roles'
    });
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get all roles with their permissions
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*, permissions:role_permissions(permission:permissions(*))')
      .order('name');
    
    if (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
    
    // Transform the data to flatten permissions
    const transformedRoles = roles.map(role => ({
      ...role,
      permissions: (role.permissions as any)?.map((p: any) => p.permission) || []
    }));
    
    return NextResponse.json(transformedRoles);
    
  } catch (error) {
    console.error('Error in GET /api/admin/roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create a new role
export async function POST(request: Request) {
  try {
    const { name, description, permission_ids } = await request.json();
    
    if (!name || !Array.isArray(permission_ids)) {
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
    
    // Check if user has permission to manage roles
    const { data: hasPermission } = await supabase.rpc('has_permission', {
      user_id: session.user.id,
      permission_name: 'manage_roles'
    });
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .single();
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }
    
    // Create the role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name,
        description,
      })
      .select()
      .single();
    
    if (roleError) {
      console.error('Error creating role:', roleError);
      throw roleError;
    }
    
    // Assign permissions to the role
    if (permission_ids.length > 0) {
      const { error: permissionError } = await supabase
        .from('role_permissions')
        .insert(permission_ids.map((permissionId: string) => ({
          role_id: role.id,
          permission_id: permissionId,
        })));
      
      if (permissionError) {
        console.error('Error assigning permissions:', permissionError);
        throw permissionError;
      }
    }
    
    // Get the created role with permissions
    const { data: createdRole } = await supabase
      .from('roles')
      .select('*, permissions:role_permissions(permission:permissions(*))')
      .eq('id', role.id)
      .single();
    
    return NextResponse.json({
      ...createdRole,
      permissions: (createdRole?.permissions as any)?.map((p: any) => p.permission) || []
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/admin/roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
