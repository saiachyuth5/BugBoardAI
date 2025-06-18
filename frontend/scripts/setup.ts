import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('Setting up database...');
  
  try {
    // Create necessary tables if they don't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id" UUID REFERENCES "roles"(id) ON DELETE CASCADE,
        "permission_id" UUID REFERENCES "permissions"(id) ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY ("role_id", "permission_id")
      );

      CREATE TABLE IF NOT EXISTS "user_roles" (
        "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        "role_id" UUID REFERENCES "roles"(id) ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY ("user_id", "role_id")
      );

      CREATE TABLE IF NOT EXISTS "admin_audit_log" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "admin_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        "action" TEXT NOT NULL,
        "resource_type" TEXT NOT NULL,
        "resource_id" TEXT,
        "previous_values" JSONB,
        "new_values" JSONB,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('Database tables created or verified');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

async function createDefaultRolesAndPermissions() {
  console.log('Creating default roles and permissions...');
  
  try {
    // Default permissions
    const permissions = [
      { name: 'manage_users', description: 'Can manage users' },
      { name: 'manage_roles', description: 'Can manage roles and permissions' },
      { name: 'manage_bugs', description: 'Can manage bug reports' },
      { name: 'view_audit_logs', description: 'Can view audit logs' },
      { name: 'export_data', description: 'Can export data' },
    ];

    // Create permissions if they don't exist
    for (const perm of permissions) {
      await prisma.$executeRaw`
        INSERT INTO permissions (name, description)
        VALUES (${perm.name}, ${perm.description})
        ON CONFLICT (name) DO NOTHING;
      `;
    }

    // Default roles
    const roles = [
      {
        name: 'super_admin',
        description: 'Full access to all features',
        permissions: ['manage_users', 'manage_roles', 'manage_bugs', 'view_audit_logs', 'export_data']
      },
      {
        name: 'admin',
        description: 'Admin access to most features',
        permissions: ['manage_users', 'manage_bugs', 'view_audit_logs']
      },
      {
        name: 'moderator',
        description: 'Limited admin access',
        permissions: ['manage_bugs']
      },
    ];

    // Create roles and assign permissions
    for (const role of roles) {
      // Create role if it doesn't exist
      const roleResult = await prisma.$queryRaw`
        INSERT INTO roles (name, description)
        VALUES (${role.name}, ${role.description})
        ON CONFLICT (name) DO UPDATE
        SET description = EXCLUDED.description
        RETURNING id;
      `;
      
      const roleId = roleResult[0]?.id;
      
      if (!roleId) continue;
      
      // Assign permissions to role
      for (const permName of role.permissions) {
        await prisma.$executeRaw`
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT ${roleId}, id FROM permissions WHERE name = ${permName}
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    console.log('Default roles and permissions created');
  } catch (error) {
    console.error('Error creating default roles and permissions:', error);
    throw error;
  }
}

async function createAdminUser(email: string, password: string) {
  console.log(`Creating admin user: ${email}`);
  
  try {
    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Admin User' },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Admin user already exists');
        return;
      }
      throw authError;
    }

    const userId = authData.user.id;
    
    // Get the super_admin role
    const superAdminRole = await prisma.$queryRaw`
      SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1;
    `;
    
    if (!superAdminRole || !superAdminRole[0]?.id) {
      throw new Error('Super admin role not found');
    }
    
    const roleId = superAdminRole[0].id;
    
    // Assign super_admin role to the user
    await prisma.$executeRaw`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${userId}, ${roleId})
      ON CONFLICT DO NOTHING;
    `;

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    process.exit(1);
  }

  try {
    await setupDatabase();
    await createDefaultRolesAndPermissions();
    await createAdminUser(email, password);
    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
