// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-4 border-b border-gray-200 bg-white/50 backdrop-blur dark:border-gray-800 dark:bg-gray-900/60">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <TrendingUp size={20} className="text-white" />
        </div>
        <span className="font-bold text-xl text-green-600">Gotrade</span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <motion.button 
          onClick={() => scrollToSection('about')}
          whileHover={{ scale: 1.05, y: -2 }}
          className="text-gray-700 hover:text-green-600 transition-colors font-medium relative group dark:text-gray-300"
        >
          About Us
          <motion.div
            className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"
          />
        </motion.button>
        <motion.button 
          onClick={() => scrollToSection('testimonials')}
          whileHover={{ scale: 1.05, y: -2 }}
          className="text-gray-700 hover:text-green-600 transition-colors font-medium relative group dark:text-gray-300"
        >
          Success Stories
          <motion.div
            className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"
          />
        </motion.button>
        <motion.button 
          onClick={() => scrollToSection('pricing')}
          whileHover={{ scale: 1.05, y: -2 }}
          className="text-gray-700 hover:text-green-600 transition-colors font-medium relative group dark:text-gray-300"
        >
          Pricing
          <motion.div
            className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"
          />
        </motion.button>
        <motion.button 
          onClick={() => scrollToSection('faq')}
          whileHover={{ scale: 1.05, y: -2 }}
          className="text-gray-700 hover:text-green-600 transition-colors font-medium relative group dark:text-gray-300"
        >
          FAQ
          <motion.div
            className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"
          />
        </motion.button>
      </div>

      {/* CTA Buttons */}
      <div className="flex items-center gap-3">
        <motion.button 
          onClick={() => router.push('/signup')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden sm:block px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold transition"
        >
          Start Trading
        </motion.button>
        <motion.button 
          onClick={() => router.push('/login')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:block px-6 py-2 text-gray-800 font-medium border border-gray-800 rounded-lg hover:bg-gray-100 transition dark:text-gray-100 dark:border-gray-100 dark:hover:bg-gray-800"
        >
          Login
        </motion.button>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:text-green-600 dark:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden dark:bg-gray-900 dark:border-gray-800"
        >
          <div className="px-6 py-4 space-y-4">
            <motion.button 
              onClick={() => scrollToSection('about')}
              whileHover={{ x: 5 }}
              className="block w-full text-left text-gray-700 hover:text-green-600 transition-colors py-2 font-medium dark:text-gray-300"
            >
              About Us
            </motion.button>
            <motion.button 
              onClick={() => scrollToSection('testimonials')}
              whileHover={{ x: 5 }}
              className="block w-full text-left text-gray-700 hover:text-green-600 transition-colors py-2 font-medium dark:text-gray-300"
            >
              Success Stories
            </motion.button>
            <motion.button 
              onClick={() => scrollToSection('pricing')}
              whileHover={{ x: 5 }}
              className="block w-full text-left text-gray-700 hover:text-green-600 transition-colors py-2 font-medium dark:text-gray-300"
            >
              Pricing
            </motion.button>
            <motion.button 
              onClick={() => scrollToSection('faq')}
              whileHover={{ x: 5 }}
              className="block w-full text-left text-gray-700 hover:text-green-600 transition-colors py-2 font-medium dark:text-gray-300"
            >
              FAQ
            </motion.button>
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <motion.button 
                onClick={() => router.push('/signup')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold transition"
              >
                Start Trading
              </motion.button>
              <motion.button 
                onClick={() => router.push('/login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full px-4 py-2 text-gray-800 font-medium border border-gray-800 rounded-lg hover:bg-gray-100 transition dark:text-gray-100 dark:border-gray-100 dark:hover:bg-gray-800"
              >
                Login
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
