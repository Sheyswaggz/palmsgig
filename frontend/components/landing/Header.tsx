'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BRAND_IMAGES } from '@/lib/constants/brand';

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
          <Image
            src={BRAND_IMAGES.logos.svg.horizontal.orange}
            alt="Palms Gig"
            width={140}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
        
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
            How It Works
          </a>
          <a href="#categories" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
            Categories
          </a>
          <a href="#testimonials" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
            Testimonials
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 hover:shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
