import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/admin/roles/[id] - Get a single role with permissions
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
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
    
    // Get the role with its permissions
    const { data: role, error } = await supabase
      .from('roles')
      .select('*, permissions:role_permissions(permission:permissions(*))')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching role:', error);
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    // Transform the data to flatten permissions
    const transformedRole = {
      ...role,
      permissions: (role.permissions as any)?.map((p: any) => p.permission) || []
    };
    
    return NextResponse.json(transformedRole);
    
  } catch (error) {
    console.error('Error in GET /api/admin/roles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[id] - Update a role
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
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
    
    // Check if role exists
    const { data: existingRole, error: existingError } = await supabase
      .from('roles')
      .select('id')
      .eq('id', id)
      .single();
    
    if (existingError || !existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Prevent modifying built-in roles
    if (['super_admin', 'admin', 'moderator'].includes(name) && name !== existingRole.name) {
      return NextResponse.json(
        { error: 'Cannot modify built-in roles' },
        { status: 400 }
      );
    }
    
    // Update the role
    const { error: updateError } = await supabase
      .from('roles')
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating role:', updateError);
      throw updateError;
    }
    
    // Update role permissions
    // First, remove all existing permissions
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id);
    
    if (deleteError) {
      console.error('Error removing role permissions:', deleteError);
      throw deleteError;
    }
    
    // Then add the new permissions
    if (permission_ids.length > 0) {
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(permission_ids.map((permissionId: string) => ({
          role_id: id,
          permission_id: permissionId,
        })));
      
      if (insertError) {
        console.error('Error adding role permissions:', insertError);
        throw insertError;
      }
    }
    
    // Get the updated role with permissions
    const { data: updatedRole } = await supabase
      .from('roles')
      .select('*, permissions:role_permissions(permission:permissions(*))')
      .eq('id', id)
      .single();
    
    return NextResponse.json({
      ...updatedRole,
      permissions: (updatedRole?.permissions as any)?.map((p: any) => p.permission) || []
    });
    
  } catch (error) {
    console.error('Error in PUT /api/admin/roles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[id] - Delete a role
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
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
    
    // Check if role exists
    const { data: existingRole, error: existingError } = await supabase
      .from('roles')
      .select('name')
      .eq('id', id)
      .single();
    
    if (existingError || !existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    // Prevent deleting built-in roles
    if (['super_admin', 'admin', 'moderator'].includes(existingRole.name)) {
      return NextResponse.json(
        { error: 'Cannot delete built-in roles' },
        { status: 400 }
      );
    }
    
    // Check if any users have this role
    const { count: userCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id);
    
    if ((userCount || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      );
    }
    
    // First, delete the role permissions
    const { error: deletePermissionsError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id);
    
    if (deletePermissionsError) {
      console.error('Error deleting role permissions:', deletePermissionsError);
      throw deletePermissionsError;
    }
    
    // Then delete the role
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting role:', deleteError);
      throw deleteError;
    }
    
    return new Response(null, { status: 204 });
    
  } catch (error) {
    console.error('Error in DELETE /api/admin/roles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
