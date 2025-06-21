import { motion } from "framer-motion";
import { Button } from "../ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[60vh] py-24 overflow-hidden bg-gradient-to-br from-blue-100 via-white to-purple-100">
      {/* Animated background circles */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute -z-10 left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-300/40 via-purple-200/30 to-pink-200/20 blur-3xl"
      />
      <div className="relative z-10 max-w-3xl text-center space-y-8">
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent drop-shadow-lg"
        >
          Fleet Performance, <span className="underline decoration-pink-400">Reimagined</span>
        </motion.h1>
        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto"
        >
          Real-time analytics, smart alerts, and beautiful dashboards for Dubai’s premium limousine fleets. Experience the next level of driver management.
        </motion.p>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Link href="/dashboard">
            <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg px-8 shadow-xl">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard/drivers">
            <Button variant="outline" size="lg" className="text-lg px-8 border-blue-700">
              Manage Drivers
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
