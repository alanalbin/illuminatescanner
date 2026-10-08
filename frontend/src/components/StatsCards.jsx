import React from 'react';
import { Users, QrCode, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Registrations',
      value: stats?.totalRegistrations ?? 50,
      icon: Users,
      color: 'text-purple-400',
      bgGlow: 'from-purple-600/20 to-purple-900/10',
      border: 'border-purple-600/30',
      subtitle: 'Confirmed participants',
    },
    {
      title: 'QR Generated',
      value: stats?.qrGenerated ?? 50,
      icon: QrCode,
      color: 'text-indigo-400',
      bgGlow: 'from-indigo-600/20 to-indigo-900/10',
      border: 'border-indigo-600/30',
      subtitle: 'Dynamic passes ready',
    },
    {
      title: 'Checked In',
      value: stats?.checkedIn ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-600/20 to-emerald-900/10',
      border: 'border-emerald-600/30',
      subtitle: `${stats?.totalRegistrations ? Math.round(((stats.checkedIn || 0) / stats.totalRegistrations) * 100) : 0}% check-in rate`,
    },
    {
      title: 'Remaining',
      value: stats?.remaining ?? 50,
      icon: Clock,
      color: 'text-amber-400',
      bgGlow: 'from-amber-600/20 to-amber-900/10',
      border: 'border-amber-600/30',
      subtitle: 'Awaiting venue arrival',
    },
    {
      title: 'Invalid Attempts',
      value: stats?.invalidAttempts ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgGlow: 'from-rose-600/20 to-rose-900/10',
      border: 'border-rose-600/30',
      subtitle: 'Rejected / suspicious scans',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${c.bgGlow} border ${c.border} backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1 duration-200`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-200/70 tracking-wide uppercase">
                {c.title}
              </span>
              <div className={`p-2 rounded-xl bg-dark-900/60 border border-white/5 ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {c.value}
              </div>
              <p className="mt-1 text-[11px] text-purple-200/60 truncate">
                {c.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
