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
    
      </div>
    
   
    </section>
  );
}
