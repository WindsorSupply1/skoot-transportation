import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const session = await getServerSession()
  
  // Check if user is admin (you'll implement this logic based on your needs)
  if (!session || !session.user) {
    redirect('/api/auth/signin')
  }
  
  return (
    <div className="section-padding">
      <div className="container-width">
        <h1 className="text-4xl font-bold mb-8 text-neutral-900">
          Admin Dashboard
        </h1>
        <AdminDashboard />
      </div>
    </div>
  )
}