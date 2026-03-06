// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Check, X, Zap, Crown, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      description: 'Perfect for beginners',
      price: isAnnual ? 4999 : 599,
      period: 'month',
      color: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      accentColor: 'text-blue-600',
      popular: false,
      features: [
        { label: 'Up to 5 Strategies', included: true },
        { label: 'Basic Market Data', included: true },
        { label: 'Email Support', included: true },
        { label: '10 Concurrent Orders', included: true },
        { label: 'Advanced Analytics', included: false },
        { label: 'Priority Support', included: false },
        { label: 'Custom Integrations', included: false }
      ]
    },
    {
      name: 'Professional',
      icon: Crown,
      description: 'For serious traders',
      price: isAnnual ? 14999 : 1999,
      period: 'month',
      color: 'from-green-50 to-emerald-100',
      borderColor: 'border-green-300',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      accentColor: 'text-green-600',
      popular: true,
      features: [
        { label: 'Unlimited Strategies', included: true },
        { label: 'Real-time Market Data', included: true },
        { label: '24/7 Priority Support', included: true },
        { label: 'Unlimited Orders', included: true },
        { label: 'Advanced Analytics', included: true },
        { label: 'Portfolio Optimization', included: true },
        { label: 'API Access', included: false }
      ]
    },
    {
      name: 'Enterprise',
      icon: Rocket,
      description: 'For institutions',
      price: isAnnual ? 49999 : 9999,
      period: 'month',
      color: 'from-purple-50 to-pink-100',
      borderColor: 'border-purple-200',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      accentColor: 'text-purple-600',
      popular: false,
      features: [
        { label: 'Unlimited Everything', included: true },
        { label: 'Premium Market Data', included: true },
        { label: 'Dedicated Account Manager', included: true },
        { label: 'Unlimited Orders', included: true },
        { label: 'Advanced Analytics', included: true },
        { label: 'Portfolio Optimization', included: true },
        { label: 'Custom Integrations', included: true }
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 dark:text-gray-100">
            Simple, Transparent
            <span className="text-green-600"> Pricing</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 dark:text-gray-300">
            Choose the perfect plan for your trading journey. Upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <span className={`font-semibold ${!isAnnual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
              Monthly
            </span>
            <motion.button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-16 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-2 border-green-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ x: isAnnual ? 32 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full"
              />
            </motion.button>
            <span className={`font-semibold ${isAnnual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
              Annual
            </span>
            {isAnnual && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full dark:bg-green-900/30 dark:text-green-300"
              >
                Save 16%
              </motion.span>
            )}
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: plan.popular ? -20 : -10, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                className={`relative group ${plan.popular ? 'md:scale-105' : ''}`}
              >
                {/* Glow effect for popular */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-all"></div>
                )}

                {/* Popular Badge */}
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular ⭐
                    </div>
                  </motion.div>
                )}

                {/* Card */}
                <div className={`relative bg-gradient-to-br ${plan.color} border-2 ${plan.borderColor} rounded-2xl p-8 h-full transition-all duration-300 overflow-hidden dark:from-gray-900 dark:to-gray-900 dark:border-gray-700`}>
                  {/* Decorative top line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color} opacity-50`}></div>

                  {/* Header */}
                  <div className="mb-8">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${plan.buttonColor} text-white`}
                    >
                      <Icon size={28} />
                    </motion.div>
                    <h3 className={`text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100`}>{plan.name}</h3>
                    <p className="text-gray-600 text-sm dark:text-gray-300">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-5xl font-black ${plan.accentColor}`}>
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-gray-600 text-sm dark:text-gray-400">/{plan.period}</span>
                    </div>
                    {isAnnual && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        ₹{Math.round(plan.price * 12).toLocaleString('en-IN')}/year
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-3 ${plan.buttonColor} text-white font-bold rounded-lg transition-all mb-8 text-lg`}
                  >
                    Get Started
                  </motion.button>

                  {/* Features */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider dark:text-gray-300">Features Included</p>
                    {plan.features.map((feature, featureIdx) => (
                      <motion.div
                        key={featureIdx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: featureIdx * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        {feature.included ? (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={16} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-gray-700">
                            <X size={16} className="text-gray-500 dark:text-gray-300" />
                          </div>
                        )}
                        <span className={`text-sm font-medium ${feature.included ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {feature.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* FAQ / Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-12 text-center dark:from-gray-900 dark:to-gray-900 dark:border-green-800"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-4 dark:text-gray-100">Questions?</h3>
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto dark:text-gray-300">
            All plans come with 30-day money-back guarantee. No credit card required for trial.
          </p>
          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            whileHover={{ scale: 1.02 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Start Free Trial
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border-2 border-green-600 text-green-600 font-bold rounded-lg hover:bg-green-50 transition-all dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950"
            >
              Contact Sales
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}