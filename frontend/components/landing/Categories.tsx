export function Categories() {
  const categories = [
    {
      name: 'Social Media Engagement',
      icon: '👍',
      count: '2.5K+ Tasks',
      color: 'bg-blue-500',
      tasks: ['Likes', 'Shares', 'Comments', 'Follows'],
    },
    {
      name: 'Content Creation',
      icon: '📸',
      count: '1.8K+ Tasks',
      color: 'bg-primary-600',
      tasks: ['Posts', 'Stories', 'Reels', 'Reviews'],
    },
    {
      name: 'App Testing',
      icon: '📱',
      count: '1.2K+ Tasks',
      color: 'bg-green-500',
      tasks: ['Downloads', 'Testing', 'Reviews', 'Ratings'],
    },
    {
      name: 'Brand Promotion',
      icon: '📢',
      count: '900+ Tasks',
      color: 'bg-orange-500',
      tasks: ['Campaigns', 'Surveys', 'Feedback', 'Referrals'],
    },
  ];

  return (
    <section id="categories" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Popular Task Categories
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Explore diverse opportunities across multiple platforms and categories
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg"
            >
              <div>
                <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${category.color} text-2xl text-white`}>
                  {category.icon}
                </div>
                
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  {category.name}
                </h3>
                
                <p className="mb-4 text-sm font-semibold text-primary-600">
                  {category.count}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {category.tasks.map((task, taskIndex) => (
                    <span
                      key={taskIndex}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {task}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <span className="font-semibold">Explore All Categories</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
