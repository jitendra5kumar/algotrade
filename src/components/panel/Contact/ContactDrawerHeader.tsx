"use client";

import { motion } from "framer-motion";
import { Mail, X } from "lucide-react";

interface ContactDrawerHeaderProps {
	onClose: () => void;
}

export default function ContactDrawerHeader({
	onClose,
}: ContactDrawerHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-3 sm:mb-5">
			<div className="flex items-center gap-2 sm:gap-2.5">
				<div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
					<Mail size={18} className="text-white" />
				</div>
				<div>
					<h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
						Contact Support
					</h2>
					<p className="text-xs text-gray-600 dark:text-gray-400">
						We&apos;re here to help you
					</p>
				</div>
			</div>
			<motion.button
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				onClick={onClose}
				className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
			>
				<X size={20} className="text-gray-600 dark:text-gray-300" />
			</motion.button>
		</div>
	);
}

