import { Coffee, Sparkles } from 'lucide-react';

/** First-paint splash shown while LIFF + settings hydrate. */
export default function Splash() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-8 buyer-shell-bg overflow-hidden">
      {/* Decorative aurora orbs */}
      <span className="aurora pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full opacity-70 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(245,179,1,0.55), transparent 70%)' }} />
      <span className="aurora pointer-events-none absolute -bottom-24 -right-12 h-80 w-80 rounded-full opacity-70 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(244,63,122,0.40), transparent 70%)' }} />
      <span className="aurora pointer-events-none absolute top-1/3 right-1/4 h-52 w-52 rounded-full opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.40), transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Halo ring */}
        <div className="relative w-32 h-32 mb-7">
          <span className="absolute inset-0 rounded-[2.2rem] spin-slow"
                style={{ background: 'conic-gradient(from 0deg, #ffd166, #f43f7a, #8b5cf6, #14b8a6, #ffd166)' }} />
          <span className="absolute inset-[3px] rounded-[2rem] bg-[var(--paper)]" />

          {/* Steam wisps */}
          <div className="absolute -top-7 left-0 right-0 flex justify-center gap-3 opacity-70">
            <span className="steam block w-1.5 h-7 rounded-full bg-[var(--ink-soft)]/40" />
            <span className="steam block w-1.5 h-9 rounded-full bg-[var(--ink-soft)]/40" />
            <span className="steam block w-1.5 h-7 rounded-full bg-[var(--ink-soft)]/40" />
          </div>

          {/* Cup */}
          <div className="absolute inset-2 rounded-[1.7rem] mesh-warm flex items-center justify-center shadow-deep">
            <Coffee size={46} className="text-[var(--gold-1)]" strokeWidth={1.6} />
          </div>
          <Sparkles size={18} className="absolute -right-1 -top-1 text-[var(--gold-2)] float-y" />
        </div>

        <p className="inline-flex items-center gap-2 text-[9.5px] font-extrabold tracking-[0.5em] uppercase text-gold">
          <span className="w-6 gilded-divider" />
          456 Coffee
          <span className="w-6 gilded-divider" />
        </p>

        <h1 className="font-display text-[22px] leading-[1.05] mt-3 ink">
          Crafted with care
        </h1>
        <p className="text-[11.5px] ink-soft mt-3 max-w-[280px] leading-relaxed font-medium">
          กำลังชงประสบการณ์ที่ดีที่สุดให้คุณ ลิ้มรสกาแฟพรีเมียมในไม่กี่อึดใจ
        </p>

        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-bounce"
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
