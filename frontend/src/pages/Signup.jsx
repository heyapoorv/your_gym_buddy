import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gymName: '',
    address: { street: '', city: '', state: '', pincode: '' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] -z-10 pointer-events-none rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl my-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary mb-4 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-white/20">
            <span className="material-symbols-outlined text-[24px]">fitness_center</span>
          </div>
          <h1 className="text-3xl font-bold text-text-main font-display tracking-tight">Create your workspace</h1>
          <p className="text-text-secondary mt-2">Set up GymOS for your gym in minutes</p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm mb-6 border border-error/20 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            {/* ── Owner Info ────────────────────────────────── */}
            <div>
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                Owner Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="John Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Work Email"
                  type="email"
                  name="email"
                  placeholder="john@gym.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ── Gym Info ──────────────────────────────────── */}
            <div className="border-t border-border pt-6">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-success">fitness_center</span>
                Gym Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Gym Name"
                    name="gymName"
                    placeholder="Elite Fitness Club"
                    value={formData.gymName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Street Address"
                    name="address.street"
                    placeholder="123 Main Street"
                    value={formData.address.street}
                    onChange={handleChange}
                  />
                </div>
                <Input
                  label="City"
                  name="address.city"
                  placeholder="Mumbai"
                  value={formData.address.city}
                  onChange={handleChange}
                />
                <Input
                  label="State"
                  name="address.state"
                  placeholder="Maharashtra"
                  value={formData.address.state}
                  onChange={handleChange}
                />
                <Input
                  label="Pincode"
                  name="address.pincode"
                  placeholder="400001"
                  value={formData.address.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Button className="w-full" type="submit" isLoading={loading} size="lg">
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
