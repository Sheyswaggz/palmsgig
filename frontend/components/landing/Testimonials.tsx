export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Content Creator',
      avatar: '👩',
      rating: 5,
      text: "Palms Gig has been a game-changer for my side income. I've earned over $5,000 in just 3 months while doing what I love on social media!",
      earnings: '$5,200',
    },
    {
      name: 'Michael Chen',
      role: 'Social Media Influencer',
      avatar: '👨',
      rating: 5,
      text: 'The platform is incredibly easy to use. Tasks are clear, payments are instant, and the support team is always helpful. Highly recommend!',
      earnings: '$8,500',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Digital Marketer',
      avatar: '👩‍💼',
      rating: 5,
      text: 'I love the variety of tasks available. Whether I have 5 minutes or an hour, there\'s always something I can do to earn extra cash.',
      earnings: '$3,800',
    },
  ];

  return (
    <section id="testimonials" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Loved by Thousands
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Join our community of successful creators earning real money
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-primary-200 hover:shadow-lg"
            >
              {/* Quote Icon */}
              <div className="absolute right-4 top-4 text-6xl text-primary-100">
                "
              </div>

              <div className="relative">
                {/* Rating Stars */}
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="mb-6 text-gray-700 italic">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Earned</div>
                    <div className="font-bold text-green-600">{testimonial.earnings}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
