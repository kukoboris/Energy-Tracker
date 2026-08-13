import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Eye, EyeOff, Zap, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const REQUIRED_EMAIL = 'kerstin@nexappcloud.com';
  const REQUIRED_PASSWORD = 'enj8rbk_kdr8gbu8RMT';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (cleanEmail === REQUIRED_EMAIL.toLowerCase() && cleanPassword === REQUIRED_PASSWORD) {
        localStorage.setItem('fatura_authenticated', 'true');
        localStorage.setItem('fatura_user_email', cleanEmail);
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Неверный логин или пароль. Проверьте введенные данные.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c1324] text-[#dce1fb] font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#adc6ff]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#8b5cf6]/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glass Card Container */}
        <div className="glass-card p-8 sm:p-10 rounded-[2.5rem] bg-[#161e2e]/80 border border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle top bar accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#adc6ff] via-[#8b5cf6] to-[#4edea3]" />

          {/* App Header Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#191f31] border border-[#adc6ff]/30 flex items-center justify-center text-[#adc6ff] mb-4 shadow-lg shadow-[#adc6ff]/5 relative group">
              <Zap className="w-8 h-8 fill-[#adc6ff]/20 animate-pulse" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#adc6ff] to-[#8b5cf6] opacity-0 group-hover:opacity-20 transition-opacity blur-md" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              FATURA <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/20">Pro</span>
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1.5 max-w-xs leading-relaxed">
              Авторизуйтесь для доступа к панели мониторинга и аналитике энергопотребления
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] text-xs font-medium flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block ml-1">
                Логин (Email)
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#94a3b8] absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0c1324]/80 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-[#94a3b8]/60 focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block ml-1">
                Пароль
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#94a3b8] absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0c1324]/80 border border-white/10 rounded-2xl pl-11 pr-11 py-3.5 text-xs text-white placeholder:text-[#94a3b8]/60 focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#94a3b8] hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#adc6ff] to-[#80a5fe] text-[#001a42] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#adc6ff]/20 hover:shadow-[#adc6ff]/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#001a42] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Войти в систему</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Badge Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-[#94a3b8]">
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
            <span>Защищенное рабочее пространство Nexapp Cloud</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
