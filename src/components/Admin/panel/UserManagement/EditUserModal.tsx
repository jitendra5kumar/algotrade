"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { User } from "./types";

interface EditUserModalProps {
	user: User | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function EditUserModal({
	user,
	isOpen,
	onClose,
	onSuccess,
}: EditUserModalProps) {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		accountType: "FREE",
	});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || "",
				email: user.email || "",
				phone: user.phone || "",
				accountType: user.accountType || "FREE",
			});
		}
	}, [user]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		setLoading(true);
		const loadingToast = toast.loading("Updating user...");

		try {
			const { updateUser } = await import("@/lib/admin-api");
			const userId = user.id || user._id;
			const response = await updateUser(userId, formData);

			if (response.success) {
				toast.success("User updated successfully", { id: loadingToast });
				onSuccess();
				onClose();
			} else {
				toast.error(response.message || "Failed to update user", {
					id: loadingToast,
				});
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to update user", {
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
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
						Edit User
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
					>
						<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{/* Name */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Name
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					{/* Email */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Email
						</label>
						<input
							type="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
							required
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					{/* Phone */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Phone
						</label>
						<input
							type="tel"
							value={formData.phone}
							onChange={(e) =>
								setFormData({ ...formData, phone: e.target.value })
							}
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					{/* Account Type */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Account Type
						</label>
						<select
							value={formData.accountType}
							onChange={(e) =>
								setFormData({ ...formData, accountType: e.target.value })
							}
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="FREE">FREE</option>
							<option value="BASIC">BASIC</option>
							<option value="PREMIUM">PREMIUM</option>
							<option value="ENTERPRISE">ENTERPRISE</option>
						</select>
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
							type="submit"
							disabled={loading}
							className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Updating..." : "Update User"}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
}

