"use client";

import { motion } from "framer-motion";
import { Plus, TrendingUp } from "lucide-react";

interface EmptyStateProps {
	onCreateClick: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-10 text-center dark:bg-gray-950 dark:border-gray-800"
		>
			<div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
				<TrendingUp size={40} className="text-green-600" strokeWidth={2} />
			</div>
			<h3 className="text-xl font-black text-gray-900 mb-2 dark:text-gray-100">
				No Strategies Yet
			</h3>
			<p className="text-gray-600 mb-5 max-w-md mx-auto text-sm dark:text-gray-300">
				Click &quot;Create Symbol&quot; to start your first automated trading
				strategy and watch it execute trades for you 24/7
			</p>
			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={onCreateClick}
				className="px-6 py-2.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-2xl transition-all inline-flex items-center gap-2"
			>
				<Plus size={18} />
				Create Your First Strategy
			</motion.button>
		</motion.div>
	);
}

