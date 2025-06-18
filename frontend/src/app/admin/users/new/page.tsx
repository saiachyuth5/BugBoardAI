'use client';

import { useRouter } from 'next/navigation';
import { UserForm } from '../_components/user-form';

export default function NewUserPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add New User</h1>
        <p className="text-muted-foreground">
          Create a new user account with the appropriate roles and permissions
        </p>
      </div>
      
      <div className="rounded-md border bg-card p-6">
        <UserForm />
      </div>
    </div>
  );
}
