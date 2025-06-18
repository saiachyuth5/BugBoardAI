import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type Params = {
  params: {
    id: string;
  };
};

// GET /api/admin/users/[id] - Get a single user with roles
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
    
    // Get the user with their roles
    const { data: user, error } = await supabase
      .from('users')
      .select('*, roles:user_roles(role:roles(*))')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({
      ...user,
      roles: (user.roles as any)?.map((r: any) => r.role) || []
    });
    
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update a user
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { email, full_name, role_ids, is_active } = await request.json();
    
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
    
    // Update user data
    const updates: any = {};
    if (email !== undefined) updates.email = email;
    if (full_name !== undefined) updates.raw_user_meta_data = { full_name };
    if (is_active !== undefined) updates.is_active = is_active;
    
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
    }
    
    // Update roles if provided
    if (Array.isArray(role_ids)) {
      // First, remove all existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);
      
      if (deleteError) {
        console.error('Error removing user roles:', deleteError);
        throw deleteError;
      }
      
      // Then add the new roles
      if (role_ids.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(role_ids.map((roleId: string) => ({
            user_id: id,
            role_id: roleId,
          })));
        
        if (insertError) {
          console.error('Error adding user roles:', insertError);
          throw insertError;
        }
      }
    }
    
    // Get the updated user with roles
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*, roles:user_roles(role:roles(*))')
      .eq('id', id)
      .single();
    
    return NextResponse.json({
      ...updatedUser,
      roles: (updatedUser?.roles as any)?.map((r: any) => r.role) || []
    });
    
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a user
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
    
    // Prevent users from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
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
    
    // First, delete the user's roles
    const { error: deleteRolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', id);
    
    if (deleteRolesError) {
      console.error('Error deleting user roles:', deleteRolesError);
      throw deleteRolesError;
    }
    
    // Then delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }
    
    return new Response(null, { status: 204 });
    
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
