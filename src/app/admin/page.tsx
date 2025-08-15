export default function AdminDashboard() {
  return (
    <html>
      <head>
        <title>Admin - Skoot Transportation</title>
      </head>
      <body>
        <div style={{minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '32px'}}>
            <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px'}}>Admin Dashboard</h1>
            <p style={{color: '#6b7280'}}>Welcome to the Skoot Transportation admin panel.</p>
            <p style={{fontSize: '14px', color: '#9ca3af', marginTop: '8px'}}>Basic admin page - no authentication required.</p>
            <p style={{fontSize: '12px', color: '#6b7280', marginTop: '16px'}}>Built: {new Date().toISOString()}</p>
          </div>
        </div>
      </body>
    </html>
  );
}