'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { BRAND_IMAGES } from '@/lib/constants/brand';
import { useAuth } from '@/hooks/use-auth';
import type { LoginFormData } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login({
        email: data.email,
        password: data.password,
      });

      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw to let LoginForm handle the error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image
              src={BRAND_IMAGES.logos.svg.horizontal.orange}
              alt="Palms Gig"
              width={180}
              height={42}
              className="mx-auto h-10 w-auto"
              priority
            />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-secondary-600">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue to your account
          </p>
        </div>

        <div className="rounded-lg bg-white px-8 py-10 shadow-md">
          <LoginForm onSubmit={handleLogin} />
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-[#FF8F33] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
