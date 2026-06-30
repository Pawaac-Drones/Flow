'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login.mutateAsync({ email, password });
      router.push('/projects');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid credentials';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Register
        </Link>
      </p>
    </form>
  );
}
