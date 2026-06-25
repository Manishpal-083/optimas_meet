import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic client-side email format regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setErrorMsg('Please input a valid email address.');
      return;
    }

    setIsLoading(true);

    // Simulate network delay for reset links dispatch
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col mesh-bg min-h-screen">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card rounded-3xl p-8 relative overflow-hidden animate-float">
          
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 w-full h-[3px] brand-gradient" />

          {/* Back button */}
          <div className="mb-6">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>

          {!isSubmitted ? (
            <>
              {/* Heading */}
              <div className="text-center mb-8">
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                  Reset Password
                </h2>
                <p className="text-sm text-slate-400 font-light mt-1.5 leading-relaxed">
                  Enter your verified email address below. We'll forward instructions to reset your password.
                </p>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm glass-input"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex h-12 items-center justify-center rounded-xl brand-gradient hover:scale-[1.01] text-white font-display font-semibold text-sm tracking-wide gap-2 transition-all duration-200 shadow-lg shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reset Instructions
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success Response Banner */
            <div className="text-center py-6 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-xl text-white">Instructions Sent</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm mx-auto">
                  If an active account is registered under <span className="text-slate-200 font-semibold">{email}</span>, password reset credentials will arrive shortly.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex h-10 px-5 items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-white/5 font-display font-semibold text-xs tracking-wide transition-all"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
