"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

interface DeleteModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function DeleteModal({
	isOpen,
	onConfirm,
	onCancel,
}: DeleteModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				className="bg-gray-50 rounded-2xl shadow-2xl max-w-md w-full p-5 dark:bg-gray-950"
			>
				<div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 bg-red-100 rounded-full">
					<Trash2 size={28} className="text-red-600" />
				</div>

				<h3 className="text-lg font-black text-gray-900 text-center mb-1.5 dark:text-gray-100">
					Delete Strategy?
				</h3>

				<p className="text-gray-600 text-center mb-5 text-sm dark:text-gray-300">
					Are you sure you want to delete this strategy? This action cannot be
					undone.
				</p>

				<div className="flex gap-2.5">
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={onCancel}
						className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300"
					>
						Cancel
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={onConfirm}
						className="flex-1 px-3 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all"
					>
						Delete
					</motion.button>
				</div>
			</motion.div>
		</div>
	);
}

