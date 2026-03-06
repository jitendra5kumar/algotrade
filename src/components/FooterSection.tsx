// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Facebook, Twitter, Linkedin, Instagram, Github, TrendingUp, Heart, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', color: 'hover:text-blue-600' },
    { icon: Twitter, label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-700' },
    { icon: Instagram, label: 'Instagram', color: 'hover:text-pink-600' },
    { icon: Github, label: 'GitHub', color: 'hover:text-gray-800' }
  ];

  const footerLinks = [
    {
      title: 'Product',
      links: ['Pricing', 'Features', 'Security', 'API Docs', 'Integrations', 'Status']
    },
    {
      title: 'Company',
      links: ['About Us', 'Blog', 'Careers', 'Press Kit', 'Partners', 'Contact']
    },
    {
      title: 'Resources',
      links: ['Documentation', 'Tutorials', 'Community', 'FAQ', 'Support', 'Webinars']
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance', 'Disclaimer', 'Risk Disclosure']
    }
  ];

  const stats = [
    { icon: Zap, value: '50K+', label: 'Active Traders' },
    { icon: TrendingUp, value: '₹500B+', label: 'Trading Volume' },
    { icon: Shield, value: '99.99%', label: 'Uptime' },
    { icon: Heart, value: '24/7', label: 'Support' }
  ];

  return (
    <footer className="bg-white border-t-2 border-green-200 relative overflow-hidden dark:bg-gray-950 dark:border-green-900">
      {/* Top Section - Newsletter + Stats */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-b-2 border-green-200 dark:from-gray-900 dark:to-gray-900 dark:border-green-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center"
          >
            {/* Left - Newsletter */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 dark:text-gray-100">
                Get Latest Updates
              </h3>
              <p className="text-gray-600 text-lg mb-6 dark:text-gray-300">
                Subscribe to our newsletter for trading tips, market insights, and exclusive offers.
              </p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-3 bg-white border-2 border-green-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors dark:bg-gray-900 dark:border-green-800"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubscribe}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Send size={18} />
                  <span>Subscribe</span>
                </motion.button>
              </div>
              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-600 font-semibold mt-3"
                >
                  ✓ Thanks for subscribing!
                </motion.p>
              )}
            </motion.div>

            {/* Right - Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5 }}
                    className="bg-white border-2 border-green-200 rounded-lg p-4 text-center group hover:border-green-400 transition-all dark:bg-gray-900 dark:border-green-900"
                  >
                    <Icon size={24} className="text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12"
        >
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <span className="text-2xl font-black text-green-600">AlgoTrade</span>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed dark:text-gray-300">
              Revolutionizing algorithmic trading in India with AI-powered strategies and institutional-grade tools.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.2, y: -3 }}
                    className={`w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-green-100 cursor-pointer transition-all ${social.color} dark:bg-gray-800 dark:text-gray-300`}
                    title={social.label}
                  >
                    <Icon size={20} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Link Columns */}
          {footerLinks.map((section, sectionIdx) => (
            <motion.div key={sectionIdx} variants={itemVariants}>
              <h4 className="font-bold text-gray-900 text-lg mb-6 dark:text-gray-100">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <motion.li
                    key={linkIdx}
                    whileHover={{ x: 5 }}
                  >
                    <div className="text-gray-600 hover:text-green-600 transition-colors font-medium flex items-center gap-2 group cursor-pointer dark:text-gray-300">
                      <span className="w-1 h-1 bg-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>
                      {link}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-8 mb-12 dark:from-gray-900 dark:to-gray-900 dark:border-green-900"
        >
          <h4 className="font-bold text-gray-900 text-xl mb-6 dark:text-gray-100">Get in Touch</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -5 }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                <Phone size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Phone</p>
                <p className="text-gray-600 dark:text-gray-300">+91 98765 43210</p>
                <p className="text-gray-600 dark:text-gray-300">+91 98765 43211</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                <Mail size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Email</p>
                <p className="text-gray-600 dark:text-gray-300">support@algotrade.com</p>
                <p className="text-gray-600 dark:text-gray-300">business@algotrade.com</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Headquarters</p>
                <p className="text-gray-600 dark:text-gray-300">Mumbai, Maharashtra</p>
                <p className="text-gray-600 dark:text-gray-300">India 400001</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t-2 border-gray-200 pt-8 dark:border-gray-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Left */}
            <p className="text-gray-600 text-center md:text-left dark:text-gray-300">
              <span className="font-semibold">© 2025 AlgoTrade.</span> All rights reserved.
            </p>

            {/* Center */}
            <div className="flex gap-6">
              <motion.div
                whileHover={{ color: '#16a34a' }}
                className="text-gray-600 font-medium hover:text-green-600 transition-colors cursor-pointer dark:text-gray-300"
              >
                Privacy
              </motion.div>
              <span className="text-gray-300">|</span>
              <motion.div
                whileHover={{ color: '#16a34a' }}
                className="text-gray-600 font-medium hover:text-green-600 transition-colors cursor-pointer dark:text-gray-300"
              >
                Terms
              </motion.div>
              <span className="text-gray-300">|</span>
              <motion.div
                whileHover={{ color: '#16a34a' }}
                className="text-gray-600 font-medium hover:text-green-600 transition-colors cursor-pointer dark:text-gray-300"
              >
                Cookies
              </motion.div>
            </div>

            {/* Right */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
            >
              <span>Made with</span>
              <Heart size={16} className="fill-red-500 text-red-500" />
              <span>in India</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Floating Animation */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-500 rounded-full opacity-30"
          animate={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `${Math.random() * 100}%`
          }}
        />
      ))}
    </footer>
  );
}