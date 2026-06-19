import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignatureStroke from '../components/SignatureStroke';
import WaxSeal from '../components/WaxSeal';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (formData) => {
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Left: ink ledger panel */}
      <div className="hidden lg:flex relative bg-ink flex-col justify-between px-12 py-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 27px, #C9A227 28px)',
          }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-parchment/80 text-sm font-medium tracking-wide uppercase">SignFlow</span>
        </div>

        <div className="relative z-10">
          <p className="text-gold text-xs uppercase tracking-[0.2em] mb-4">Every signature, accounted for</p>
          <h1 className="font-display text-parchment text-4xl leading-tight mb-6 max-w-md">
            Your name carries
            <br />
            weight. Sign it well.
          </h1>
          <SignatureStroke className="w-72 h-20" />
          <p className="text-parchment/50 text-sm mt-6 max-w-sm">
            Documents signed here are sealed with a full audit trail — who signed,
            when, and from where.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-parchment/40 text-xs">
          <WaxSeal size={28} />
          <span>Tamper-evident · Legally traceable · Always logged</span>
        </div>
      </div>

      {/* Right: parchment form panel */}
      <div className="flex items-center justify-center bg-parchment px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <WaxSeal size={32} />
            <span className="font-display text-ink text-lg">SignFlow</span>
          </div>

          <h2 className="font-display text-3xl text-ink mb-1">Welcome back</h2>
          <p className="text-graphite/60 text-sm mb-8">Sign in to manage your documents</p>

          {error && (
            <div className="bg-seal/10 border border-seal/30 text-seal-dark text-sm rounded-md px-3 py-2 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wide text-graphite/60 font-medium mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-transparent border-0 border-b-2 border-ink/15 focus:border-seal outline-none py-2 text-ink placeholder:text-graphite/30 transition-colors"
                {...register('email')}
              />
              {errors.email && <p className="text-seal text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-graphite/60 font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-transparent border-0 border-b-2 border-ink/15 focus:border-seal outline-none py-2 text-ink placeholder:text-graphite/30 transition-colors"
                {...register('password')}
              />
              {errors.password && <p className="text-seal text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-ink-light text-parchment font-medium py-3 rounded-md transition-colors disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
              {!isSubmitting && (
                <span className="font-signature text-lg text-gold-light group-hover:translate-x-0.5 transition-transform">
                  ✓
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-graphite/60 mt-8">
            New to SignFlow?{' '}
            <Link to="/register" className="text-seal font-medium hover:text-seal-dark">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}