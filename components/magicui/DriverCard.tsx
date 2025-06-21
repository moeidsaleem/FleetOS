import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Users, Star, AlertTriangle, Phone, Eye } from "lucide-react";
import Link from "next/link";

interface DriverCardProps {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
  currentScore?: number;
  alertCount?: number;
  onAlert?: () => void;
}

export default function DriverCard({ id, name, phoneNumber, status, currentScore, alertCount, onAlert }: DriverCardProps) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl bg-white/90 shadow-lg p-6 flex flex-col gap-3 border border-gray-100 hover:scale-[1.02] hover:shadow-2xl transition-transform min-h-[180px]"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-tr from-blue-200 via-purple-200 to-pink-200 text-blue-700 font-bold text-xl">
          <Users className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900 truncate">{name}</div>
          <div className="text-sm text-gray-500 truncate">{phoneNumber}</div>
        </div>
        <Badge variant={status === 'ACTIVE' ? 'default' : status === 'SUSPENDED' ? 'destructive' : 'secondary'} className="text-xs">
          {status}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1 text-yellow-500 font-semibold">
          <Star className="h-4 w-4" />
          <span>{currentScore !== undefined ? `${(currentScore * 100).toFixed(1)}%` : '--'}</span>
        </div>
        <div className="flex items-center gap-1 text-pink-600 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          <span>{alertCount ?? 0} Alerts</span>
        </div>
        <div className="flex-1" />
        <Link href={`/dashboard/drivers/${id}`}>
          <Button size="sm" variant="outline" className="rounded-lg">
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
        </Link>
        {onAlert && (
          <Button size="sm" variant="destructive" className="rounded-lg" onClick={onAlert}>
            <Phone className="h-4 w-4 mr-1" /> Alert
          </Button>
        )}
      </div>
    </motion.div>
  );
}
