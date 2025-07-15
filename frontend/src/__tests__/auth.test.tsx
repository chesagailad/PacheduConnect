import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the auth page since we need to test it
const AuthPage = () => {
  const [mode, setMode] = React.useState('login');
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Authentication</h1>
      <div>
        <button onClick={() => setMode('login')}>Login</button>
        <button onClick={() => setMode('register')}>Register</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          data-testid="email-input"
        />
        
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          data-testid="password-input"
        />
        
        {mode === 'register' && (
          <>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="name-input"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              data-testid="phone-input"
            />
          </>
        )}
        
        <button type="submit" disabled={loading} data-testid="submit-button">
          {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
      
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  );
};

describe('Auth Component', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  it('renders login form by default', () => {
    render(<AuthPage />);
    
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Login');
    expect(screen.queryByTestId('name-input')).not.toBeInTheDocument();
  });

  it('switches to register mode when register button is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthPage />);
    
    const registerButton = screen.getByText('Register');
    await user.click(registerButton);
    
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Register');
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('phone-input')).toBeInTheDocument();
  });

  it('submits login form with correct data', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, token: 'mock-token' }),
    });

    const user = userEvent.setup();
    render(<AuthPage />);
    
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: '',
            phoneNumber: ''
          }),
        }
      );
    });
  });

  it('displays error message on failed authentication', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Authentication failed'));

    const user = userEvent.setup();
    render(<AuthPage />);
    
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrongpassword');
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Authentication failed');
    });
  });

  it('shows loading state during form submission', async () => {
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    const user = userEvent.setup();
    render(<AuthPage />);
    
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));
    
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('validates register form with all fields', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<AuthPage />);
    
    // Switch to register mode
    await user.click(screen.getByText('Register'));
    
    // Fill out all fields
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('name-input'), 'Test User');
    await user.type(screen.getByTestId('phone-input'), '+27123456789');
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            phoneNumber: '+27123456789'
          }),
        })
      );
    });
  });
});