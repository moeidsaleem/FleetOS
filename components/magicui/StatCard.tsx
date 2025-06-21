import { motion } from "framer-motion";
import { Skeleton } from "../ui/skeleton";
import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  loading?: boolean;
  color?: string;
}

export default function StatCard({ icon, label, value, sublabel, loading, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`rounded-2xl bg-white/90 shadow-lg p-6 flex flex-col items-center justify-center min-h-[140px] border border-gray-100 hover:scale-[1.03] transition-transform ${color || ''}`}
    >
      <div className="mb-2 flex items-center justify-center text-blue-600">{icon}</div>
      <div className="text-2xl font-bold mb-1">
        {loading ? <Skeleton className="h-8 w-16" /> : value}
      </div>
      <div className="text-sm text-gray-500 font-medium mb-1">{label}</div>
      {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
    </motion.div>
  );
}
