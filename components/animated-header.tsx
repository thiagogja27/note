'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

// Custom Cargo Ship SVG component
const CargoShip = ({ ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 250 100" // Increased viewbox for more detail
    width="100" // Increased size for better visibility
    height="50"
    {...props}
  >
    {/* Waves */}
    <motion.path
      d="M0 85 Q 31.25 75, 62.5 85 T 125 85 T 187.5 85 T 250 85 L 250 100 L 0 100 Z"
      fill="#3B82F6"
      opacity="0.5"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.path
      d="M0 90 Q 31.25 80, 62.5 90 T 125 90 T 187.5 90 T 250 90 L 250 100 L 0 100 Z"
      fill="#60A5FA"
      opacity="0.5"
      animate={{ y: [0, 2, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Hull */}
    <path d="M10 50 C 20 50, 20 75, 30 75 L 220 75 C 230 75, 230 50, 240 50 L 10 50 Z" fill="#6B7280" />
    <rect x="10" y="50" width="230" height="10" fill="#4B5563" />

    {/* Containers */}
    <rect x="30" y="30" width="40" height="20" fill="#D97706" />
    <rect x="75" y="30" width="40" height="20" fill="#059669" />
    <rect x="120" y="30" width="40" height="20" fill="#DC2626" />

    {/* Superstructure */}
    <path d="M170 50 L 170 20 L 210 20 L 215 50 Z" fill="#E5E7EB" />
    <rect x="175" y="25" width="25" height="10" fill="#374151" />

    {/* Smokestack */}
    <rect x="215" y="35" width="10" height="15" fill="#9CA3AF" />
  </svg>
)

export function AnimatedHeader() {
  const animationDuration = 15 // seconds

  return (
    <>
      {/* Baltech Logo */}
      <motion.div
        className="absolute top-5 left-5"
        style={{ zIndex: 1 }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        <Image src="/baltech-logo.png" alt="Baltech Logo" width={130} height={130} />
      </motion.div>

      {/* TEAG Logo */}
      <motion.div
        className="absolute top-5 right-5"
        style={{ zIndex: 1 }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        <Image src="/teag-logo.png" alt="TEAG Logo" width={130} height={130} />
      </motion.div>

      {/* The Cargo Ship */}
      <motion.div
        className="absolute"
        style={{ top: 100, left: 200 }} // Adjusted position
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          left: 'calc(100% - 300px)', // Adjusted position
        }}
        transition={{
          delay: 1.5,
          duration: animationDuration,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={{ scaleX: [1, 1, -1, -1, 1] }} // Flip the ship
          transition={{
            duration: animationDuration * 2,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.495, 0.505, 0.995, 1], // Smoother flip
            delay: 1.5,
          }}
        >
          <CargoShip />
        </motion.div>
      </motion.div>
    </>
  )
}
