import { motion } from "framer-motion";

export default function WelcomeText({ name }: { name: string }) {
  return (
    <motion.h1
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-5xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent drop-shadow-lg mb-4 text-left"
    >
      Welcome {name}.
    </motion.h1>
  );
}
