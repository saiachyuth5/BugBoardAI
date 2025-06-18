'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import { UserForm } from '../_components/user-form';
import { useToast } from '@/components/ui/use-toast';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Check if current user has permission to edit users
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Check if user has permission to edit users
        const { data: hasPermission } = await supabase.rpc('has_permission', {
          user_id: user.id,
          permission_name: 'manage_users',
        });

        if (!hasPermission) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to edit users.',
            variant: 'destructive',
          });
          router.push('/admin/users');
          return;
        }

        setIsUserAdmin(true);
      } catch (error) {
        console.error('Error checking permissions:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while checking your permissions.',
          variant: 'destructive',
        });
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [router, supabase, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isUserAdmin) {
    return null; // Will redirect from the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
        <p className="text-muted-foreground">
          Update user details, roles, and account status
        </p>
      </div>
      
      <div className="rounded-md border bg-card p-6">
        <UserForm userId={userId} />
      </div>
    </div>
  );
}
