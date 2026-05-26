import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loginAsDemo } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setDemoLoading(true);
    const res = await loginAsDemo();
    if (res.success) {
      navigate('/');
    } else {
      setDemoLoading(false);
      alert('Demo login failed. Ensure seed data is generated.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4 text-white">
            <span className="material-symbols-outlined text-[24px]">fitness_center</span>
          </div>
          <h1 className="text-3xl font-bold text-text-main font-display tracking-tight">Welcome back</h1>
          <p className="text-text-muted mt-2">Sign in to your GymOS workspace</p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-md text-sm mb-6 border border-error/20 text-center font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              label="Email address" 
              type="email" 
              placeholder="name@gym.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="flex items-center justify-between text-sm mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary" />
                <span className="text-text-muted">Remember me</span>
              </label>
              <a href="#" className="text-primary hover:text-primary-hover font-medium">Forgot password?</a>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Button className="w-full" type="submit" isLoading={loading}>
                Sign In
              </Button>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-text-muted text-xs uppercase tracking-widest font-bold">Or</span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              <Button variant="secondary" className="w-full border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary" type="button" onClick={handleDemo} isLoading={demoLoading}>
                Try Interactive Demo
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-text-muted">
            Don't have an account? <Link to="/signup" className="text-primary hover:text-primary-hover font-medium">Start your free trial</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
