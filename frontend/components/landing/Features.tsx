export function Features() {
  const features = [
    {
      icon: '🔍',
      title: 'Smart Task Discovery',
      description: 'AI-powered matching connects you with tasks that fit your audience and interests perfectly.',
      color: 'bg-blue-500',
    },
    {
      icon: '💳',
      title: 'Secure Escrow Payments',
      description: 'Your earnings are protected with our escrow system. Get paid instantly when tasks are approved.',
      color: 'bg-green-500',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Track your performance, earnings, and growth with detailed analytics and insights.',
      color: 'bg-primary-600',
    },
    {
      icon: '🤝',
      title: 'Direct Communication',
      description: 'Chat with task creators directly to clarify requirements and build lasting relationships.',
      color: 'bg-orange-500',
    },
    {
      icon: '⚡',
      title: 'Instant Notifications',
      description: 'Stay updated with real-time notifications for new tasks, messages, and payment confirmations.',
      color: 'bg-yellow-500',
    },
    {
      icon: '🛡️',
      title: 'Verified Businesses',
      description: 'All task creators are verified and monitored to ensure safe and legitimate opportunities.',
      color: 'bg-secondary-600',
    },
  ];

  return (
    <section id="features" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Everything You Need to Succeed
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Powerful tools and features designed to help you maximize your earnings
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-primary-200 hover:shadow-lg"
            >
              <div>
                <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl ${feature.color} text-3xl text-white`}>
                  {feature.icon}
                </div>
                
                <h3 className="mb-3 text-2xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
