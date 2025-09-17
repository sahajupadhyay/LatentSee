export default function TestPage() {
  return (
    <div style={{
      backgroundColor: '#1f2937',
      color: 'white',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{
        fontSize: '2rem',
        color: '#3b82f6',
        marginBottom: '1rem'
      }}>
        Test Page - Styling Check
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        If you can see this page with dark background and blue header, 
        the server is working but Tailwind CSS might not be loading.
      </p>
      <div style={{
        backgroundColor: '#374151',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginTop: '1rem'
      }}>
        <h2 style={{ color: '#10b981' }}>Styling Test</h2>
        <p>This box should have a dark gray background with green text header.</p>
      </div>
    </div>
  );
}