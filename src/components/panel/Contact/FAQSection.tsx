"use client";

import { motion } from "framer-motion";
import { FAQ } from "./types";

interface FAQSectionProps {
	faqs: FAQ[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
	return (
		<div className="mt-5 sm:mt-6 border-t border-gray-200 pt-5 sm:pt-6 dark:border-gray-800">
			<h3 className="text-base sm:text-lg font-black text-gray-900 mb-3 sm:mb-4 dark:text-gray-100">
				Quick Help
			</h3>

			<div className="space-y-3">
				{faqs.map((faq, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 hover:border-green-300 transition-all dark:from-gray-900 dark:to-gray-900 dark:border-green-800"
					>
						<h4 className="font-bold text-gray-900 mb-1.5 text-xs flex items-start gap-2 dark:text-gray-100">
							<span className="text-green-600 flex-shrink-0 dark:text-green-400">
								Q:
							</span>
							{faq.question}
						</h4>
						<p className="text-gray-700 text-xs leading-relaxed pl-4 dark:text-gray-300">
							{faq.answer}
						</p>
					</motion.div>
				))}
			</div>
		</div>
	);
}

