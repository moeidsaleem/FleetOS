import { motion } from "framer-motion";
import { Button } from "../ui/button";
import Link from "next/link";
import { OrbitingCircles } from "./orbiting-circles";
import { File, Settings, Search, ArrowRightIcon } from "lucide-react";
import { Ripple } from "./ripple";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";


export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[60vh] py-24 overflow-hidden ">

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute -z-20 left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-900/5 via-purple-700/5 to-pink-900/5 blur-3xl"
      />
      {/* Ripple Animation */}
      <Ripple className="-z-15 w-[500px] h-[500px]" />
      {/* Orbiting Circles Animation */}
      <div className="absolute -z-10 left-1/2 top-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {/* <OrbitingCircles>
          <File />
          <Settings />
          <Search />
        </OrbitingCircles>
        <OrbitingCircles radius={100} reverse>
          <File />
          <Settings />
          <File />
          <Search />
        </OrbitingCircles> */}
      </div>
      <div className="relative z-10 max-w-3xl text-center space-y-8"> 
        <h1 className="text-4xl font-bold text-white"> 
          Welcome to Fleet OS 
        </h1>
         <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
         >
           <Link href="/dashboard/drivers">
             <Button 
               className="group relative overflow-hidden bg-gradient-to-r  from-blue-600/5 via-purple-600/5 to-pink-600/5 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:text-black shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 border-0"
             
             >
               <motion.div
                 className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                 initial={{ x: "-100%" }}
                 whileHover={{ x: "100%" }}
                 transition={{ duration: 0.6 }}
               />
               <span className="relative z-10 flex items-center gap-3">
                 <motion.div
                   animate={{ rotate: 360 }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 >
                   <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                     <ArrowRightIcon className="w-4 h-4 text-white" />
                   </div>
                 </motion.div>
                 Summon Fleet Commander
                 <motion.div
                   animate={{ x: [0, 5, 0] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                 >
                   <ArrowRightIcon className="w-5 h-5" />
                 </motion.div>
               </span>
             </Button>
           </Link>
         </motion.div>
    
      </div>
    
   
    </section>
  );
}
