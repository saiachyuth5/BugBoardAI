'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Loader2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Role = {
  id: string;
  name: string;
  description: string | null;
};

const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .or(z.literal(''))
    .optional(),
  confirmPassword: z.string().optional(),
  role_ids: z.array(z.string()).min(1, 'At least one role is required'),
  is_active: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.password && data.password.length > 0) {
      return data.password === data.confirmPassword;
    }
    return true;
  },
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: string;
  defaultValues?: Partial<UserFormValues>;
}

export function UserForm({ userId, defaultValues }: UserFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(!!userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      full_name: '',
      password: '',
      confirmPassword: '',
      role_ids: [],
      is_active: true,
      ...defaultValues,
    },
  });

  // Fetch user data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        
        // Check if we're editing the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id === userId) {
          setIsCurrentUser(true);
        }

        // Fetch user data
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        
        // Update form with user data
        form.reset({
          email: userData.email,
          full_name: userData.raw_user_meta_data?.full_name || '',
          password: '',
          confirmPassword: '',
          role_ids: userData.roles?.map((r: Role) => r.id) || [],
          is_active: userData.is_active,
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, form, supabase]);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/admin/roles');
        
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load roles',
          variant: 'destructive',
        });
      }
    };

    fetchRoles();
  }, []);

  const onSubmit = async (data: UserFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare the data to send
      const userData: any = {
        email: data.email,
        full_name: data.full_name,
        role_ids: data.role_ids,
        is_active: data.is_active,
      };

      // Only include password if it's being changed
      if (data.password) {
        userData.password = data.password;
      }

      const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
      const method = userId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save user');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: userId ? 'User updated successfully' : 'User created successfully',
      });

      // Redirect to user list after a short delay
      setTimeout(() => {
        router.push('/admin/users');
      }, 1000);

      return result;
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to users
        </Button>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="user-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {userId ? 'Update User' : 'Create User'}
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} id="user-form" className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="user@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        disabled={isSubmitting || !!userId}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={userId ? 'Leave blank to keep current password' : '••••••••'}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      {userId ? 'Leave blank to keep current password' : 'At least 8 characters'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isSubmitting || !form.watch('password')}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="role_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const currentRoles = form.getValues('role_ids') || [];
                        const newRoles = currentRoles.includes(value)
                          ? currentRoles.filter((id) => id !== value)
                          : [...currentRoles, value];
                        field.onChange(newRoles);
                      }}
                      value=""
                      disabled={isSubmitting || isCurrentUser}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role to add" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isCurrentUser
                        ? 'You cannot change your own roles'
                        : 'Select a role to add it to the user'}
                    </FormDescription>
                    <FormMessage />
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.value?.map((roleId) => {
                        const role = roles.find((r) => r.id === roleId);
                        if (!role) return null;
                        
                        return (
                          <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                            {role.name}
                            {!isCurrentUser && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const newRoles = field.value.filter((id) => id !== roleId);
                                  field.onChange(newRoles);
                                }}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                                disabled={isSubmitting}
                              >
                                <span className="sr-only">Remove {role.name}</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-3 w-3"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            )}
                          </Badge>
                        );
                      })}
                      {(!field.value || field.value.length === 0) && (
                        <span className="text-sm text-muted-foreground">No roles assigned</span>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || isCurrentUser}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        {isCurrentUser
                          ? 'You cannot deactivate your own account'
                          : 'Inactive users cannot sign in'}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
