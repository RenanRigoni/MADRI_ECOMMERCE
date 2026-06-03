'use client'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'

export default function NewsletterForm() {
  return (
    <form
      className="flex w-full sm:w-auto max-w-sm"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="Seu e-mail"
        className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.10] px-4 py-2.5 text-[11px] text-white placeholder-gray-500 outline-none focus:border-[#C4A55C]/50 transition-colors"
        style={{ fontFamily: bodyFont }}
      />
      <button
        type="submit"
        className="cursor-pointer bg-[#C4A55C] text-[#0A0A0A] text-[10px] tracking-[0.2em] uppercase font-semibold px-5 py-2.5 hover:bg-[#E1C880] transition-colors whitespace-nowrap"
        style={{ fontFamily: bodyFont }}
      >
        Assinar
      </button>
    </form>
  )
}
