'use client';

import Link from 'next/link';
import { BRAND_IMAGES } from '@/lib/constants/brand';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-20">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(${BRAND_IMAGES.pattern})`,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
        }}
      />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
            🎉 Join 10,000+ Active Users
          </div>
          
          <h1 className="mb-6 text-5xl font-bold leading-tight text-secondary-600 md:text-6xl lg:text-7xl">
            Turn Your Social Media Into Income
          </h1>
          
          <p className="mb-8 text-xl text-gray-600 md:text-2xl">
            Connect with brands, complete engaging social media tasks, and earn rewards.
            The marketplace for digital creators and businesses.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="rounded-lg bg-primary-600 px-8 py-4 font-semibold text-white transition-all hover:bg-primary-700 hover:shadow-lg"
            >
              Start Earning Today
            </Link>
            
            <Link
              href="#how-it-works"
              className="rounded-lg border-2 border-primary-600 bg-white px-8 py-4 font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              See How It Works →
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
