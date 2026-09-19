import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldCheck } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(name, email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-14 h-14 text-emerald-500" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-3xl font-extrabold tracking-tight text-white">
          Create Sentinel Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Join to monitor your APIs in real-time
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-10 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-lg text-sm text-center font-bold tracking-wide shadow-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 uppercase">Full Name</label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 uppercase">Email address</label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  placeholder="admin@sentinel.dev"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 uppercase">Password</label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-emerald-600 py-3.5 px-4 text-sm font-bold tracking-wider uppercase text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <div className="text-center mt-4 text-sm text-slate-400 font-medium">
              Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 ml-1">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
