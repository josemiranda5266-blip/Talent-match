import React from 'react';
import { X, Bell, Trophy, CheckCircle2, Sparkles } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'match' | 'view' | 'trial';
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Notificaciones de TalentMatch</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Notificaciones de búsquedas compatibles y visitas</span>
            <button onClick={onMarkAllRead} className="text-emerald-400 font-bold hover:underline">
              Marcar todas como leídas
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[70vh]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-1 ${
                  n.unread
                    ? 'bg-slate-950 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {n.type === 'match' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                    {n.type === 'trial' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-500">{n.time}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          TalentMatch Alert System • Recibes avisos automáticos según tu perfil deportivo
        </div>
      </div>
    </div>
  );
};
