const scheduleData = [
  {
    route: 'Downtown → Airport',
    weekdays: ['6:00 AM', '8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM'],
    weekends: ['8:00 AM', '12:00 PM', '6:00 PM'],
    duration: '45 min',
  },
  {
    route: 'Airport → Downtown',
    weekdays: ['7:00 AM', '9:00 AM', '1:00 PM', '5:00 PM', '9:00 PM'],
    weekends: ['9:00 AM', '1:00 PM', '7:00 PM'],
    duration: '45 min',
  },
  {
    route: 'Business District → Airport',
    weekdays: ['6:30 AM', '8:30 AM', '12:30 PM', '4:30 PM', '8:30 PM'],
    weekends: ['8:30 AM', '12:30 PM', '6:30 PM'],
    duration: '35 min',
  },
]

export default function ScheduleTable() {
  return (
    <div className="space-y-8">
      <div className="card">
        <h3 className="text-xl font-semibold mb-6 text-neutral-900">
          Regular Routes & Schedules
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-semibold text-neutral-900">Route</th>
                <th className="text-left py-3 px-4 font-semibold text-neutral-900">Weekdays</th>
                <th className="text-left py-3 px-4 font-semibold text-neutral-900">Weekends</th>
                <th className="text-left py-3 px-4 font-semibold text-neutral-900">Duration</th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((route, index) => (
                <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-neutral-900">{route.route}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-2">
                      {route.weekdays.map((time, timeIndex) => (
                        <span
                          key={timeIndex}
                          className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-2">
                      {route.weekends.map((time, timeIndex) => (
                        <span
                          key={timeIndex}
                          className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-sm"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-neutral-600">{route.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-neutral-900">
            Important Notes
          </h3>
          <ul className="space-y-2 text-neutral-600">
            <li>• Arrive 10 minutes before scheduled departure</li>
            <li>• Schedule may vary on holidays</li>
            <li>• Additional stops available upon request</li>
            <li>• Group discounts available for 6+ passengers</li>
          </ul>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-neutral-900">
            Need a Custom Schedule?
          </h3>
          <p className="text-neutral-600 mb-4">
            Contact us for charter services or custom pickup times.
          </p>
          <button className="btn-primary">
            Request Custom Service
          </button>
        </div>
      </div>
    </div>
  )
}