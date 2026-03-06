// @ts-nocheck
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	CheckCircle,
	Circle,
	MessageSquare,
	Plus,
	Send,
	ToggleLeft,
	ToggleRight,
	Trash2,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
	createBroadcast,
	deleteBroadcast,
	getAllBroadcasts,
	toggleBroadcast,
} from "@/lib/broadcast-api";

export default function AdminBroadcast() {
	const [broadcasts, setBroadcasts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [formData, setFormData] = useState<{ title: string; message: string }>({
		title: "",
		message: "",
	});
	const [sending, setSending] = useState(false);

	const fetchBroadcasts = async () => {
		try {
			const response = await getAllBroadcasts();
			if (response.success) {
				setBroadcasts(response.data || []);
			}
		} catch (error) {
			console.error("Error fetching broadcasts:", error);
			toast.error("Failed to load broadcasts");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBroadcasts();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.title.trim() || !formData.message.trim()) {
			toast.error("Please fill all fields");
			return;
		}

		setSending(true);
		try {
			const response = await createBroadcast(formData.title, formData.message);
			if (response.success) {
				toast.success("Broadcast sent successfully!");
				setFormData({ title: "", message: "" });
				setDrawerOpen(false);
				fetchBroadcasts();
			} else {
				toast.error(response.message || "Failed to send broadcast");
			}
		} catch (error) {
			toast.error(error.message || "Failed to send broadcast");
		} finally {
			setSending(false);
		}
	};

	const handleDelete = async (broadcastId) => {
		if (!confirm("Are you sure you want to delete this broadcast?")) return;

		try {
			const response = await deleteBroadcast(broadcastId);
			if (response.success) {
				toast.success("Broadcast deleted successfully");
				fetchBroadcasts();
			}
		} catch (error) {
			toast.error("Failed to delete broadcast");
		}
	};

	const handleToggle = async (broadcastId) => {
		try {
			const response = await toggleBroadcast(broadcastId);
			if (response.success) {
				toast.success(response.message);
				fetchBroadcasts();
			}
		} catch (error) {
			toast.error("Failed to toggle broadcast");
		}
	};

	const formatDate = (date) => {
		return new Date(date).toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
						Broadcast Messages
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">Send notifications to all users</p>
				</div>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setDrawerOpen(true)}
					className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all"
				>
					<Plus className="w-5 h-5" />
					New Broadcast
				</motion.button>
			</div>

			{/* Broadcasts List */}
			<div className="grid grid-cols-1 gap-6">
				{broadcasts.length === 0 ? (
					<div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
						<MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
							No broadcasts yet
						</h3>
						<p className="text-gray-500 dark:text-gray-400">Create your first broadcast message</p>
					</div>
				) : (
					broadcasts.map((broadcast) => (
						<motion.div
							key={broadcast._id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
											{broadcast.title}
										</h3>
										<span
											className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
												broadcast.isActive
													? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
													: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
											}`}
										>
											{broadcast.isActive ? (
												<>
													<Circle className="w-2 h-2 fill-green-500 text-green-500" />
													Active
												</>
											) : (
												<>
													<Circle className="w-2 h-2 fill-gray-500 text-gray-500" />
													Inactive
												</>
											)}
										</span>
									</div>
									<p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
										{broadcast.message}
									</p>

									<div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
										<div className="flex items-center gap-2">
											<Users className="w-4 h-4" />
											<span>{broadcast.readCount || 0} read</span>
										</div>
										<div className="flex items-center gap-2">
											<CheckCircle className="w-4 h-4" />
											<span>{formatDate(broadcast.createdAt)}</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2 ml-4">
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => handleToggle(broadcast._id)}
										className={`p-2 rounded-lg transition-colors ${
											broadcast.isActive
												? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
												: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
										}`}
										title={broadcast.isActive ? "Deactivate" : "Activate"}
									>
										{broadcast.isActive ? (
											<ToggleRight className="w-5 h-5" />
										) : (
											<ToggleLeft className="w-5 h-5" />
										)}
									</motion.button>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => handleDelete(broadcast._id)}
										className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
										title="Delete"
									>
										<Trash2 className="w-5 h-5" />
									</motion.button>
								</div>
							</div>
						</motion.div>
					))
				)}
			</div>

			{/* Create Broadcast Drawer */}
			<AnimatePresence>
				{drawerOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setDrawerOpen(false)}
							className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
						/>

						{/* Drawer */}
						<motion.div
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "spring", damping: 30, stiffness: 300 }}
							className="fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-xl bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
						>
							{/* Header */}
							<div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
											<MessageSquare className="w-6 h-6 text-white" />
										</div>
										<div>
											<h2 className="text-2xl font-bold text-white">
												New Broadcast
											</h2>
											<p className="text-sm text-green-50">
												Send notification to all users
											</p>
										</div>
									</div>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => setDrawerOpen(false)}
										className="p-2 hover:bg-white/20 rounded-xl transition-colors"
									>
										<X className="w-6 h-6 text-white" />
									</motion.button>
								</div>
							</div>

							{/* Form */}
							<form
								onSubmit={handleSubmit}
								className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto"
							>
								{/* Title */}
								<div>
									<label
										htmlFor="title"
										className="block text-gray-800 dark:text-gray-200 font-bold mb-2 text-sm"
									>
										Notification Title
									</label>
									<input
										name="title"
										type="text"
										placeholder="e.g., System Maintenance"
										value={formData.title}
										onChange={(e) =>
											setFormData({ ...formData, title: e.target.value })
										}
										maxLength={200}
										className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
									/>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{formData.title.length}/200 characters
									</p>
								</div>

								{/* Message */}
								<div>
									<label
										htmlFor="message"
										className="block text-gray-800 dark:text-gray-200 font-bold mb-2 text-sm"
									>
										Message
									</label>
									<textarea
										placeholder="Enter your message here..."
										value={formData.message}
										onChange={(e) =>
											setFormData({ ...formData, message: e.target.value })
										}
										maxLength={1000}
										rows={8}
										className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all resize-none"
									/>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{formData.message.length}/1000 characters
									</p>
								</div>

								{/* Preview */}
								{(formData.title || formData.message) && (
									<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
										<p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
											Preview
										</p>
										{formData.title && (
											<h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
												{formData.title}
											</h4>
										)}
										{formData.message && (
											<p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
												{formData.message}
											</p>
										)}
									</div>
								)}

								<div className="flex-1"></div>

								{/* Submit Button */}
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									type="submit"
									disabled={
										sending ||
										!formData.title.trim() ||
										!formData.message.trim()
									}
									className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
								>
									{sending ? (
										<>
											<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
											Sending...
										</>
									) : (
										<>
											<Send className="w-5 h-5" />
											Send Broadcast
										</>
									)}
								</motion.button>
							</form>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
