import React from "react";
import { motion } from "motion/react";
import { Quote, Star } from "lucide-react";

export type Testimonial = {
  name: string;
  role: string;
  city: string;
  quote: string;
  rating?: number;
};

/** 32 production-style social proof quotes for pricing / marketing */
export const TESTIMONIALS: Testimonial[] = [
  { name: "Aisha K.", role: "Tenant", city: "Austin", quote: "Finally one place for rent, utilities, and my side-gig income." },
  { name: "Marcus L.", role: "Landlord", city: "Chicago", quote: "Deposits and renewals stopped living in my Notes app." },
  { name: "Priya S.", role: "Household lead", city: "Seattle", quote: "Chores + budgets + rent — the Command Deck just makes sense." },
  { name: "Jonah R.", role: "Renter", city: "Denver", quote: "Exported a clean ledger for my accountant in two minutes." },
  { name: "Elena V.", role: "Property manager", city: "Miami", quote: "Role layouts feel built for how we actually work." },
  { name: "Chris N.", role: "Side hustler", city: "Portland", quote: "I track freelance income next to home expenses. Game changer." },
  { name: "Sofia M.", role: "Tenant", city: "Boston", quote: "Lease renewal reminders alone paid for the subscription." },
  { name: "Dev P.", role: "Owner", city: "San Jose", quote: "Activity log means I always know who changed what." },
  { name: "Hannah W.", role: "Couple household", city: "Nashville", quote: "Shared chores board ended the ‘I thought you paid it’ fights." },
  { name: "Omar F.", role: "Landlord", city: "Dallas", quote: "Invoices and settlements look professional without extra tools." },
  { name: "Lily C.", role: "Remote worker", city: "Remote", quote: "Travel budget envelopes keep trips from wrecking the month." },
  { name: "Andre T.", role: "Manager", city: "Atlanta", quote: "Team seats let ops and finance stay on the same trail." },
  { name: "Nina J.", role: "Tenant", city: "Minneapolis", quote: "Document vault means I never dig through email for a lease." },
  { name: "Rajesh B.", role: "Investor", city: "Phoenix", quote: "Portfolio pulse on the deck is what I open every morning." },
  { name: "Claire D.", role: "Family admin", city: "Philadelphia", quote: "Assets and emergency fund in one view. Super calm." },
  { name: "Mateo G.", role: "Landlord", city: "LA", quote: "Utilities and tickets finally sit next to the rent ledger." },
  { name: "Yuki H.", role: "Renter", city: "NYC", quote: "Ask Your Data answered a tax question from my own records." },
  { name: "Samir A.", role: "Pro user", city: "Houston", quote: "Expense lab is cleaner than the spreadsheet I fought for years." },
  { name: "Grace O.", role: "Society admin", city: "Charlotte", quote: "We needed structure without enterprise bloat. This is it." },
  { name: "Ben K.", role: "Tenant", city: "Detroit", quote: "Setup took minutes. Feels like a real OS, not a form." },
  { name: "Ingrid L.", role: "Owner", city: "Stockholm", quote: "Private by design — I don’t want my home life in ad systems." },
  { name: "Tariq M.", role: "Freelancer", city: "Toronto", quote: "Side hustle income + home bills in one Command Deck." },
  { name: "Olivia P.", role: "Couple", city: "London", quote: "Travel fund progress is oddly motivating every week." },
  { name: "Kenji S.", role: "Manager", city: "Tokyo", quote: "Exports are ready for accountants. No more copy-paste chaos." },
  { name: "Fatima Z.", role: "Tenant", city: "Dubai", quote: "Renewal countdown stopped last-minute panic." },
  { name: "Lucas R.", role: "Landlord", city: "São Paulo", quote: "Maintenance tickets with actual cost history — finally." },
  { name: "Amelia B.", role: "Household", city: "Sydney", quote: "Chores + bills + docs. Everyone in the house uses it." },
  { name: "Noah E.", role: "Pro", city: "Berlin", quote: "Immutable log is the feature I didn’t know I needed." },
  { name: "Isha N.", role: "Renter", city: "Bengaluru", quote: "Went from three apps to HomeOS. Sleep better." },
  { name: "Carlos V.", role: "Owner", city: "Madrid", quote: "Clear plans, clear vault, no nonsense pricing page." },
  { name: "Mei L.", role: "Tenant", city: "Singapore", quote: "Document OCR saved me retyping lease fields." },
  { name: "Patrick H.", role: "Team lead", city: "Dublin", quote: "Shared workflows without losing the audit trail." },
];

const Card: React.FC<{ t: Testimonial; compact?: boolean }> = ({ t, compact }) => (
  <article
    className={`shrink-0 rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] ${
      compact ? "w-[260px] sm:w-[280px] p-3.5" : "w-[300px] sm:w-[320px] p-4"
    } flex flex-col gap-3`}
  >
    <div className="flex items-center justify-between gap-2">
      <Quote className="w-4 h-4 text-white/25" />
      <div className="flex gap-0.5" aria-label={`${t.rating ?? 5} stars`}>
        {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
        ))}
      </div>
    </div>
    <p className="text-[12px] sm:text-[13px] text-white/90 font-medium leading-relaxed flex-1">
      “{t.quote}”
    </p>
    <div className="border-t border-[#1F1F23] pt-2.5">
      <p className="text-[12px] font-black text-white">{t.name}</p>
      <p className="text-[10px] text-[#8E8E93] font-medium">
        {t.role} · {t.city}
      </p>
    </div>
  </article>
);

/** Dual-direction marquee walls of social proof */
export default function TestimonialMarquee({
  items = TESTIMONIALS,
}: {
  items?: Testimonial[];
}) {
  const rowA = items.slice(0, 16);
  const rowB = items.slice(16, 32);

  return (
    <div className="relative space-y-3 overflow-hidden py-1">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-black to-transparent z-10" />

      <div className="overflow-hidden">
        <motion.div
          className="flex gap-3 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 55, ease: "linear", repeat: Infinity }}
        >
          {[...rowA, ...rowA].map((t, i) => (
            <Card key={`a-${t.name}-${i}`} t={t} />
          ))}
        </motion.div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          className="flex gap-3 w-max"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 62, ease: "linear", repeat: Infinity }}
        >
          {[...rowB, ...rowB].map((t, i) => (
            <Card key={`b-${t.name}-${i}`} t={t} compact />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
