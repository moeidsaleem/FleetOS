import { motion } from "framer-motion";

export default function MagicLogo({ size = 40, className }: { size?: number, className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ rotate: -10, scale: 0.9 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      <defs>
        <linearGradient id="magic-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="0.5" stopColor="#a21caf" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      {/* Stylized steering wheel with a crown */}
      <circle cx="32" cy="32" r="28" stroke="url(#magic-gradient)" strokeWidth="6" fill="currentColor" />
      <path d="M20 44c4-8 20-8 24 0" stroke="url(#magic-gradient)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="32" r="8" stroke="url(#magic-gradient)" strokeWidth="3" fill="none" />
      {/* Crown */}
      <path d="M24 20l4 6 4-8 4 8 4-6" stroke="url(#magic-gradient)" strokeWidth="3" fill="none" strokeLinejoin="round" />
    </motion.svg>
  );
}
