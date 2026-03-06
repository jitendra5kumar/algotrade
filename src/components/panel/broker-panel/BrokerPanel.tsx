
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Orderbook from './Orderbook';
import Tradebook from './Tradebook';
import Positions from './Positions';
import Holding from './Holding';

export default function BrokerPanel() {
  const [activeTab, setActiveTab] = useState('orderbook');

  const tabs = [
    { id: 'orderbook', label: 'Orderbook', component: Orderbook },
    { id: 'tradebook', label: 'Tradebook', component: Tradebook },
    { id: 'positions', label: 'Positions', component: Positions },
    { id: 'holding', label: 'Holding', component: Holding },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1.5 dark:text-gray-100">
          Broker Panel
        </h1>
        <p className="text-xs lg:text-sm text-gray-600 font-medium dark:text-gray-300">
          Manage your orders, trades, positions, and holdings
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden dark:bg-gray-950 dark:border-gray-800">
        {/* Tab Headers */}
        <div className="flex overflow-x-auto bg-gray-50 border-b-2 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all relative ${
                activeTab === tab.id
                  ? 'text-green-600 bg-white dark:bg-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </motion.div>
  );
}

