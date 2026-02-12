export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up in minutes and connect your social media accounts. Set your preferences and interests.',
      image: '👤',
    },
    {
      number: '02',
      title: 'Browse & Select Tasks',
      description: 'Discover tasks that match your profile. Filter by category, payment, and difficulty level.',
      image: '🔍',
    },
    {
      number: '03',
      title: 'Complete Tasks',
      description: 'Follow the task guidelines and submit your work. Track progress in your dashboard.',
      image: '✨',
    },
    {
      number: '04',
      title: 'Get Paid Instantly',
      description: 'Once approved, funds are released instantly to your wallet. Withdraw anytime to your bank.',
      image: '💸',
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Get started in 4 simple steps and start earning within minutes
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-8 top-16 hidden h-full w-0.5 bg-primary-600 md:block" />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-start gap-6 md:flex-row">
                {/* Step Number Circle */}
                <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white shadow-md">
                  {step.image}
                </div>

                {/* Content Card */}
                <div className="flex-1 rounded-2xl bg-gray-50 p-8 transition-all hover:shadow-lg">
                  <div className="mb-2 text-sm font-bold text-primary-600">
                    STEP {step.number}
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-4 font-semibold text-white transition-all hover:bg-primary-700 hover:shadow-lg"
          >
            Start Your Journey Now
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
