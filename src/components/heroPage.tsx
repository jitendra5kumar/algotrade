// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, TrendingUp, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface CandleType {
  open: number;
  close: number;
  high: number;
  low: number;
}

export default function AlgotradeHero() {
  const [candleData, setCandleData] = useState<CandleType[]>([]);
  const router = useRouter();

  useEffect(() => {
    const generateCandles = () => {
      let price = 50000;
      return Array.from({ length: 50 }, () => {
        const open = price;
        const close = price + (Math.random() - 0.5) * 4000;
        const high = Math.max(open, close) + Math.random() * 2000;
        const low = Math.min(open, close) - Math.random() * 2000;
        price = close;
        return { open, close, high, low };
      });
    };
    setCandleData(generateCandles());
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 }
    }
  };

  const CandleChart = () => {
    if (candleData.length === 0) return null;

    const minPrice = Math.min(...candleData.map(c => c.low)) * 0.95;
    const maxPrice = Math.max(...candleData.map(c => c.high)) * 1.05;
    const range = maxPrice - minPrice;
    const width = 1200;
    const height = 1000;
    const candleWidth = (width / candleData.length) * 2;

    return (
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={(height / 10) * i}
            x2={width}
            y2={(height / 10) * i}
            stroke="#10b981"
            strokeWidth="0.5"
            opacity="0.2"
          />
        ))}

        {candleData.map((candle, idx) => {
          const high = ((maxPrice - candle.high) / range) * height;
          const low = ((maxPrice - candle.low) / range) * height;
          const open = ((maxPrice - candle.open) / range) * height;
          const close = ((maxPrice - candle.close) / range) * height;

          const x = idx * candleWidth + candleWidth / 2;
          const bodyTop = Math.min(open, close);
          const bodyHeight = Math.abs(close - open) || 1;
          const isGreen = close < open;

          return (
            <g key={`candle-${idx}`}>
              <line
                x1={x}
                y1={high}
                x2={x}
                y2={low}
                stroke={isGreen ? '#10b981' : '#ef4444'}
                strokeWidth="3"
                opacity="0.7"
              />
              <rect
                x={x - candleWidth * 0.4}
                y={bodyTop}
                width={candleWidth * 0.8}
                height={bodyHeight}
                fill={isGreen ? '#10b981' : '#ef4444'}
                opacity="0.8"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  const features = [
    { icon: Zap, text: 'Lightning Fast', subtext: '< 1ms Execution' },
    { icon: TrendingUp, text: 'AI Powered', subtext: 'Neural Networks' },
    { icon: Lock, text: 'Secure', subtext: 'Military Grade' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white text-gray-900 overflow-hidden dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
        {/* Animated Candlestick Background */}
        <div className="absolute inset-0 overflow-hidden">
          <CandleChart />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/50 dark:from-gray-950 dark:via-transparent dark:to-gray-900/60"></div>
        </div>

        {/* Animated Background Blobs */}
        <motion.div 
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"
        ></motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-1/4 left-10 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl"
        ></motion.div>

        {/* Main Content */}
        <motion.div 
          className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-block mb-8 px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-300 rounded-full backdrop-blur-sm dark:from-green-900/30 dark:to-blue-900/30 dark:border-green-700"
          >
            <span className="text-green-700 font-bold text-sm dark:text-green-300">🤖 AI-Powered Trading Revolution</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            variants={itemVariants}
            className="mb-6 leading-tight text-gray-900 dark:text-gray-100"
          >
            <span className="whitespace-nowrap text-2xl md:text-4xl font-bold">Trade Smarter, Earn Smarter</span>
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent block mt-2 text-6xl md:text-8xl font-black">via Gotrade</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed font-medium dark:text-gray-300"
          >
            Automate your strategies, eliminate emotions, and dominate the market with AI-powered algorithms that execute with millisecond precision
          </motion.p>

          {/* Feature Pills */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isSecure = feature.text === 'Secure';
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(34, 197, 94, 0.2)' }}
                  className={`flex items-center gap-3 bg-white/80 backdrop-blur-sm border-2 border-green-200 hover:border-green-400 px-6 py-3 rounded-full transition-all group dark:bg-gray-900/60 dark:border-green-700 ${isSecure ? 'hidden md:flex' : ''}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm dark:text-gray-100">{feature.text}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{feature.subtext}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-row gap-3 sm:gap-4 justify-center mb-20"
          >
            <motion.button 
              onClick={() => router.push('/signup')}
              whileHover={{ scale: 1.08, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 sm:px-10 sm:py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl hover:shadow-2xl font-bold text-sm sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all group relative overflow-hidden"
            >
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <span>Get Started</span>
                <ArrowRight size={16} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </motion.button>

            <motion.button 
              onClick={() => router.push('/signup')}
              whileHover={{ scale: 1.08, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 sm:px-10 sm:py-4 bg-white border-3 border-green-600 text-green-600 rounded-xl hover:bg-green-50 font-bold text-sm sm:text-lg transition-all dark:bg-transparent dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
            >
              Learn More
            </motion.button>
          </motion.div>

          {/* Stats Card */}
          <motion.div 
            variants={itemVariants}
            className="mt-24 relative"
          >
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-2xl"></div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="relative bg-white/95 backdrop-blur-lg border-2 border-green-200 hover:border-green-400 rounded-3xl p-8 md:p-12 shadow-2xl transition-all dark:bg-gray-900/80 dark:border-green-800 dark:hover:border-green-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {[
                  { label: '50K+', value: 'Active Traders', icon: '👥', color: 'from-blue-500 to-cyan-500' },
                  { label: '₹500B+', value: 'Trading Volume', icon: '📊', color: 'from-green-500 to-emerald-500' },
                  { label: '99.99%', value: 'Uptime SLA', icon: '⚡', color: 'from-purple-500 to-pink-500' }
                ].map((stat, idx) => (
                  <motion.div 
                    key={idx} 
                    className="text-center group relative"
                    whileHover={{ scale: 1.08, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Stat glow */}
                    <div className={`absolute -inset-4 bg-gradient-to-r ${stat.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-all`}></div>

                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: idx * 0.4 }}
                      className="text-5xl mb-3 group-hover:scale-125 transition-transform relative z-10"
                    >
                      {stat.icon}
                    </motion.div>
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: idx * 0.25 }}
                      className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 relative z-10`}
                    >
                      {stat.label}
                    </motion.div>
                    <div className="text-gray-700 font-bold text-lg group-hover:text-gray-900 transition-colors relative z-10 dark:text-gray-300 dark:group-hover:text-gray-100">{stat.value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-20 flex justify-center"
          >
            <div className="text-gray-600 font-medium dark:text-gray-300">
              Scroll to explore more →
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}