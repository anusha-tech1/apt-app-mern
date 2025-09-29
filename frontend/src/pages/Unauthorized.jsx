import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Unauthorized</h2>
        <p style={{ marginTop: 0, color: '#6b7280' }}>You do not have permission to view this page.</p>
        <div style={{ marginTop: 12 }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>Go Home</Link>
        </div>
      </div>
    </div>
  );
}
