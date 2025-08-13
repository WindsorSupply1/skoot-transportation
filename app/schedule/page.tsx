import ScheduleTable from '@/components/schedule/ScheduleTable'

export default function SchedulePage() {
  return (
    <div className="section-padding">
      <div className="container-width">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 text-neutral-900">
            Transportation Schedule
          </h1>
          <p className="text-xl text-center text-neutral-600 mb-12">
            View our regular departure times and routes
          </p>
          <ScheduleTable />
        </div>
      </div>
    </div>
  )
}