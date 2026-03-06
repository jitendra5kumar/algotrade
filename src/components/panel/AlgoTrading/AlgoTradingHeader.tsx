"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface AlgoTradingHeaderProps {
	onCreateClick: () => void;
}

export default function AlgoTradingHeader({
	onCreateClick,
}: AlgoTradingHeaderProps) {
	return (
		<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 lg:mb-6">
			<div>
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1.5 dark:text-gray-100">
					Algo Trading
				</h1>
				<p className="text-xs lg:text-sm text-gray-600 font-medium dark:text-gray-300">
					Manage your automated trading strategies
				</p>
			</div>

			{/* Create Symbol Button */}
			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={onCreateClick}
				className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2"
			>
				<Plus size={18} strokeWidth={2.5} />
				Create Symbol
			</motion.button>
		</div>
	);
}

