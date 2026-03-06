// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Zap, Shield, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = [
    {
      category: 'Getting Started',
      icon: Zap,
      questions: [
        {
          q: 'How do I start trading on AlgoTrade?',
          a: 'Getting started is simple! Create an account, complete KYC verification (takes 5 minutes), add funds, and start deploying your first algorithm. We provide step-by-step tutorials for beginners.'
        },
        {
          q: 'Do I need coding knowledge to use AlgoTrade?',
          a: 'No! Our visual strategy builder allows you to create algorithms without coding. However, if you\'re a developer, our Python API gives you full customization power.'
        },
        {
          q: 'What is the minimum amount to start trading?',
          a: 'You can start with as little as ₹1,000 on our Starter plan. Most traders start with ₹50,000+ to diversify strategies effectively.'
        },
        {
          q: 'Can I trade on weekends?',
          a: 'Our platform runs 24/7, but Indian stock market operates Monday-Friday, 9:15 AM - 3:30 PM. You can set up strategies to execute automatically during market hours.'
        }
      ]
    },
    {
      category: 'Features & Technology',
      icon: Cpu,
      questions: [
        {
          q: 'What makes AlgoTrade different from other platforms?',
          a: 'AlgoTrade combines AI-powered strategy engine, millisecond-level execution, institutional-grade tools, and a community of 50K+ traders. Our neural network adapts to market conditions in real-time.'
        },
        {
          q: 'How fast is order execution?',
          a: 'We execute orders in milliseconds (< 1ms), giving you an edge in fast-moving markets. Our infrastructure uses redundant connections for maximum reliability.'
        },
        {
          q: 'Can I backtest my strategies?',
          a: 'Yes! Our backtesting engine lets you test strategies on 10+ years of historical data. You can optimize parameters and see realistic performance metrics before going live.'
        },
        {
          q: 'What data sources do you use?',
          a: 'We use real-time data from NSE, BSE, and international exchanges. Professional plan gets premium data feeds with additional indicators and signals.'
        }
      ]
    },
    {
      category: 'Security & Safety',
      icon: Shield,
      questions: [
        {
          q: 'Is my money safe on AlgoTrade?',
          a: 'Absolutely. All funds are held in segregated accounts with SEBI-registered brokers. We use military-grade encryption (AES-256) for all transactions and data.'
        },
        {
          q: 'What if AlgoTrade goes down?',
          a: 'We have 99.99% uptime SLA with redundant servers across multiple locations. All strategies continue executing even if one server fails. Your data is auto-backed up every minute.'
        },
        {
          q: 'How do you prevent unauthorized access?',
          a: 'We use 2FA, biometric authentication, IP whitelisting, and real-time fraud detection. All API calls are signed with your unique keys.'
        },
        {
          q: 'Is my trading data private?',
          a: 'Your data is 100% private. We use end-to-end encryption. We never share or sell your data to third parties. Only you can access your strategies and performance.'
        }
      ]
    },
    {
      category: 'Support & Billing',
      icon: HelpCircle,
      questions: [
        {
          q: 'Do you offer customer support?',
          a: 'Yes! Starter plan gets email support (24 hours response). Professional & Enterprise get 24/7 live chat, phone, and dedicated support managers.'
        },
        {
          q: 'Can I cancel my subscription anytime?',
          a: 'Absolutely! Cancel anytime, no questions asked. You\'ll get immediate access to your data. We also offer 30-day money-back guarantee on all plans.'
        },
        {
          q: 'Are there any hidden fees?',
          a: 'No hidden fees ever! Pricing is transparent - monthly subscription only. You only pay exchange charges (same as traditional brokers) on executed trades.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit/debit cards, UPI, net banking, and wallet payments. Enterprise plans can do wire transfers or annual billing.'
        }
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 dark:text-gray-100">
            Frequently Asked
            <span className="text-green-600"> Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-300">
            Everything you need to know about Gotrade          </p>
        </motion.div>

        {/* FAQ Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-12"
        >
          {faqs.map((section, sectionIdx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={sectionIdx}
                variants={itemVariants}
                className="group"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center"
                  >
                    <Icon size={20} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{section.category}</h3>
                  <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-transparent rounded-full opacity-50"></div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {section.questions.map((item, qIdx) => {
                    const globalIndex = faqs.slice(0, sectionIdx).reduce((acc, s) => acc + s.questions.length, 0) + qIdx;
                    const isOpen = activeIndex === globalIndex;

                    return (
                      <motion.div
                        key={qIdx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: qIdx * 0.05 }}
                      >
                        <motion.button
                          onClick={() => setActiveIndex(isOpen ? -1 : globalIndex)}
                          className="w-full group/btn"
                        >
                          <div className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 group-hover/btn:border-green-400 rounded-xl p-6 transition-all duration-300 text-left dark:from-gray-900 dark:to-gray-900 dark:border-gray-700 dark:group-hover/btn:border-green-700">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 group-hover/btn:text-green-600 transition-colors dark:text-gray-100">
                                  {item.q}
                                </h4>
                              </div>
                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex-shrink-0 mt-1"
                              >
                                <ChevronDown
                                  size={24}
                                  className="text-green-600 group-hover/btn:text-green-700"
                                />
                              </motion.div>
                            </div>

                            {/* Answer */}
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4 mt-4 border-t border-gray-300 dark:border-gray-700">
                                    <p className="text-gray-600 leading-relaxed text-base dark:text-gray-300">
                                      {item.a}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}