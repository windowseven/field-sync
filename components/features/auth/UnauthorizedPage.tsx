export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      color: '#000',
      fontFamily: 'sans-serif',
      padding: '24px',
    }}>
      <div style={{ fontSize: '18px' }}>
        403 | Unauthorized
      </div>
    </div>
  );
}
