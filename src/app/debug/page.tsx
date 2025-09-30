'use client';

import { useAuth } from '@/lib/auth/context';

export default function TestPage() {
  const { user, isLoading, isAuthenticated, error } = useAuth();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Auth Debug Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>Authentication State:</h3>
        <p><strong>Is Loading:</strong> {String(isLoading)}</p>
        <p><strong>Is Authenticated:</strong> {String(isAuthenticated)}</p>
        <p><strong>Has User:</strong> {String(Boolean(user))}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
      </div>

      {user && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e8f5e8' }}>
          <h3>User Data:</h3>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Email Verified:</strong> {String(user.emailVerified)}</p>
          {user.profile && (
            <>
              <p><strong>Full Name:</strong> {user.profile.fullName}</p>
              <p><strong>First Name:</strong> {user.profile.firstName}</p>
              <p><strong>Last Name:</strong> {user.profile.lastName}</p>
            </>
          )}
        </div>
      )}

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff5f5' }}>
        <h3>Environment Check:</h3>
        <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
        <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f8ff' }}>
        <h3>Debug Actions:</h3>
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.clear();
              window.location.reload();
            }
          }}
          style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px', cursor: 'pointer' }}
        >
          Clear Auth Storage & Reload
        </button>
        <button 
          onClick={() => {
            console.log('LocalStorage contents:', Object.keys(localStorage).map(key => ({ key, value: localStorage.getItem(key) })));
          }}
          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Log Storage Contents
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/auth/login" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', marginRight: '10px' }}>
          Go to Login
        </a>
        <a href="/dashboard" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none' }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}