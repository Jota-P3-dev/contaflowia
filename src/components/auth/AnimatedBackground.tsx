import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
}

export function AnimatedBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  useEffect(() => {
    // Generate random stars
    const generatedStars: Star[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 3 + 2,
    }));
    setStars(generatedStars);

    // Generate shooting stars
    const generatedShootingStars: ShootingStar[] = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      startX: Math.random() * 80 + 10,
      startY: Math.random() * 30,
      duration: Math.random() * 1 + 1,
      delay: i * 4,
    }));
    setShootingStars(generatedShootingStars);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(270,50%,25%)] via-[hsl(280,45%,35%)] to-[hsl(320,40%,30%)]" />

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-50"
        animate={{
          background: [
            "radial-gradient(circle at 20% 80%, hsl(280, 60%, 40%) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, hsl(320, 50%, 35%) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 40%, hsl(270, 55%, 30%) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 80%, hsl(280, 60%, 40%) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Shooting Stars */}
      {shootingStars.map((star) => (
        <motion.div
          key={`shooting-${star.id}`}
          className="absolute h-[2px] bg-gradient-to-r from-white via-white to-transparent rounded-full"
          style={{
            left: `${star.startX}%`,
            top: `${star.startY}%`,
            width: "80px",
            transformOrigin: "left center",
          }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 35 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, 200],
            y: [0, 120],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            repeatDelay: 8,
            ease: "easeIn",
          }}
        />
      ))}

      {/* Moon */}
      <motion.div
        className="absolute top-[10%] right-[15%] w-16 h-16 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, hsl(40, 60%, 90%), hsl(35, 50%, 75%))",
          boxShadow: "0 0 40px 10px hsla(40, 60%, 80%, 0.3)",
        }}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Abstract mountain shapes */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[60%]"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        {/* Back mountain layer */}
        <motion.path
          d="M0,600 L0,350 Q200,250 400,320 Q600,400 800,280 Q1000,160 1200,250 Q1350,300 1440,280 L1440,600 Z"
          fill="hsla(280, 40%, 25%, 0.6)"
          initial={{ y: 20 }}
          animate={{ y: [20, 0, 20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Middle mountain layer */}
        <motion.path
          d="M0,600 L0,400 Q150,350 300,380 Q500,420 700,340 Q900,260 1100,320 Q1300,380 1440,350 L1440,600 Z"
          fill="hsla(290, 35%, 22%, 0.7)"
          initial={{ y: 10 }}
          animate={{ y: [10, -5, 10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        
        {/* Front mountain layer */}
        <motion.path
          d="M0,600 L0,450 Q200,400 400,430 Q600,460 800,400 Q1000,340 1200,390 Q1350,420 1440,400 L1440,600 Z"
          fill="hsla(300, 30%, 18%, 0.8)"
          initial={{ y: 5 }}
          animate={{ y: [5, -10, 5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Foreground wave */}
        <motion.path
          d="M0,600 L0,500 Q180,470 360,490 Q540,510 720,480 Q900,450 1080,475 Q1260,500 1440,470 L1440,600 Z"
          fill="hsla(310, 25%, 15%, 0.9)"
          initial={{ y: 0 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </svg>

      {/* Floating particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{
            left: `${10 + i * 12}%`,
            bottom: `${20 + Math.random() * 30}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
