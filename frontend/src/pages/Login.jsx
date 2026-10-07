import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(username.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-700/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 border border-purple-500/20 shadow-glow-purple-lg">
          
          {/* Header branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-0.5 shadow-glow-purple mb-4">
              <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
                <img 
                  src="/logos/illuminate-torch.png" 
                  alt="Illuminate" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <ShieldCheck className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <h1 className="text-2xl font-extrabold text-white tracking-wide">
              ILLUMINATE
            </h1>
            <p className="text-xs uppercase font-bold tracking-widest text-purple-400 mt-1">
              EVENT MANAGEMENT SYSTEM
            </p>
            <p className="text-xs text-purple-200/60 mt-1">
              IIT Bombay E-Cell &bull; KMCT
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-200 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-purple-200/80 mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin or admin@illuminate.kmct.in"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-950/80 border border-purple-700/40 text-white placeholder-purple-400/30 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-purple-200/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-950/80 border border-purple-700/40 text-white placeholder-purple-400/30 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-purple-400/60 mt-1">
                Default credentials: <span className="font-mono text-purple-300">admin</span> / <span className="font-mono text-purple-300">admin123</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-purple disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Authenticating...' : 'LOGIN TO ADMIN'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-purple-900/40 text-center">
            <span className="text-[11px] text-purple-300/60">
              Event Volunteer?{' '}
              <a href="/scanner" className="text-purple-300 font-semibold hover:underline">
                Open QR Scanner
              </a>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
