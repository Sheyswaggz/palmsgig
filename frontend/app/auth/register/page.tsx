'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { BRAND_IMAGES } from '@/lib/constants/brand';
import { useAuth } from '@/hooks/use-auth';
import type { RegisterFormData } from '@/lib/validations/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (data: RegisterFormData) => {
    console.log('📝 REGISTER PAGE - handleRegister called:', {
      data: { ...data, password: '[REDACTED]', confirmPassword: '[REDACTED]' },
      timestamp: new Date().toISOString()
    });

    try {
      // Map RegisterFormData to RegisterRequest format expected by API
      const registerRequest = {
        email: data.email,
        password: data.password,
        username: data.email.split('@')[0], // Generate username from email
        full_name: data.fullName,
        phone_number: data.phone,
      };

      console.log('📤 REGISTER PAGE - Calling auth.register():', {
        request: { ...registerRequest, password: '[REDACTED]' },
        timestamp: new Date().toISOString()
      });

      await register(registerRequest);

      console.log('✅ REGISTER PAGE - Registration successful, redirecting to verification');
      
      // Redirect to verification page
      router.push('/auth/verify-email');
    } catch (error) {
      console.error('❌ REGISTER PAGE - Registration failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error; // Re-throw to let RegisterForm handle the error
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Palms Gig and start your flexible work journey
          </p>
        </div>

        <div className="rounded-lg bg-white px-8 py-10 shadow-md">
          <RegisterForm onSubmit={handleRegister} />
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
