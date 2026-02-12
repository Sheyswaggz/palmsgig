export function Stats() {
  const stats = [
    { value: '10K+', label: 'Active Users', icon: '👥' },
    { value: '$2M+', label: 'Paid Out', icon: '💰' },
    { value: '50K+', label: 'Tasks Completed', icon: '✅' },
    { value: '4.9/5', label: 'User Rating', icon: '⭐' },
  ];

  return (
    <section className="border-y bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-4xl">{stat.icon}</div>
              <div className="mb-1 text-4xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
