export const dynamic = 'force-static';

export const metadata = {
  title: 'Admin Dashboard - Skoot Transportation',
  description: 'Admin panel for Skoot Transportation',
};

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
        <p className="text-gray-600 mb-2">Welcome to the Skoot Transportation admin panel.</p>
        <p className="text-sm text-gray-500 mb-4">Basic admin page - no authentication required.</p>
        
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
              View Bookings
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
              Manage Schedules
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
              Customer Reports
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-xs text-gray-400">
          Status: Admin panel placeholder
        </div>
      </div>
    </div>
  );
}