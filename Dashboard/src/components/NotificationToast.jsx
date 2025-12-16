import { useMqtt } from '../context/MqttContext';

export default function NotificationToast() {
    const { notifications, dismissNotification, clearNotifications } = useMqtt();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {notifications.length > 1 && (
                <button
                    onClick={clearNotifications}
                    className="self-end text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
                >
                    Hapus Semua
                </button>
            )}
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className={`p-4 rounded-xl shadow-2xl border backdrop-blur-lg animate-slide-in flex items-start gap-3 ${notif.type === 'danger'
                            ? 'bg-red-500/90 border-red-400 text-white'
                            : notif.type === 'warning'
                                ? 'bg-amber-500/90 border-amber-400 text-white'
                                : 'bg-teal-500/90 border-teal-400 text-white'
                        }`}
                >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                        {notif.type === 'danger' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : notif.type === 'warning' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold opacity-80">{notif.sensor}</span>
                            <span className="text-xs opacity-60">{notif.time}</span>
                        </div>
                        <p className="text-sm font-medium leading-tight">{notif.message}</p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => dismissNotification(notif.id)}
                        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}

            <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
