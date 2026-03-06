"use client";

import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import type { User } from "./types";

interface DeleteUserModalProps {
	user: User | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function DeleteUserModal({
	user,
	isOpen,
	onClose,
	onSuccess,
}: DeleteUserModalProps) {
	const [loading, setLoading] = useState(false);
	const [confirmText, setConfirmText] = useState("");

	const handleDelete = async () => {
		if (!user) return;

		// Require typing "DELETE" to confirm
		if (confirmText !== "DELETE") {
			toast.error('Please type "DELETE" to confirm');
			return;
		}

		setLoading(true);
		const loadingToast = toast.loading("Deleting user...");

		try {
			const { deleteUser } = await import("@/lib/admin-api");
			const userId = user.id || user._id;
			const response = await deleteUser(userId);

			if (response.success) {
				toast.success("User deleted successfully", { id: loadingToast });
				onSuccess();
				onClose();
				setConfirmText("");
			} else {
				toast.error(response.message || "Failed to delete user", {
					id: loadingToast,
				});
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to delete user", {
				id: loadingToast,
			});
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen || !user) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
							<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
						</div>
						<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
							Delete User
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
					>
						<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-4">
					<p className="text-gray-600 dark:text-gray-400">
						Are you sure you want to delete{" "}
						<span className="font-semibold text-gray-900 dark:text-gray-100">
							{user.name}
						</span>
						? This action cannot be undone.
					</p>

					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
						<p className="text-sm text-red-800 dark:text-red-300">
							<strong>Warning:</strong> This will permanently delete:
							<ul className="list-disc list-inside mt-2 space-y-1">
								<li>User account and all associated data</li>
								<li>All user strategies</li>
								<li>All user trades</li>
							</ul>
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Type <span className="font-mono font-bold">DELETE</span> to
							confirm:
						</label>
						<input
							type="text"
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							placeholder="DELETE"
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
						/>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={loading || confirmText !== "DELETE"}
							className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Deleting..." : "Delete User"}
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}

