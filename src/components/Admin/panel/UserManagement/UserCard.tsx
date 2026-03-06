"use client";

import { motion } from "framer-motion";
import {
	Calendar,
	Edit,
	Mail,
	Pause,
	Phone,
	Play,
	Trash2,
	UserCheck,
	UserX,
} from "lucide-react";
import { User } from "./types";

interface UserCardProps {
	user: User;
	onStatusToggle: (userId: string, currentStatus: string) => void;
	onEdit?: (user: User) => void;
	onDelete?: (user: User) => void;
}

export default function UserCard({
	user,
	onStatusToggle,
	onEdit,
	onDelete,
}: UserCardProps) {
	const userId = user.id || user._id || "";

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
		>
			<div className="flex items-start justify-between mb-4">
				<div>
					<h3 className="font-bold text-gray-900 dark:text-gray-100">
						{user.name}
					</h3>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						ID: {userId}
					</p>
				</div>
				<button
					type="button"
					onClick={() => onStatusToggle(userId, user.status)}
					className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
						user.status === "active"
							? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
							: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
					}`}
				>
					{user.status === "active" ? (
						<UserCheck className="w-3 h-3" />
					) : (
						<UserX className="w-3 h-3" />
					)}
					{user.status}
				</button>
			</div>

			<div className="space-y-2 mb-4">
				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
					<Mail className="w-4 h-4" />
					{user.email}
				</div>
				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
					<Phone className="w-4 h-4" />
					{user.phone}
				</div>
				<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
					<Calendar className="w-4 h-4" />
					{user.joinDate}
				</div>
				<div className="mt-2">
					<span
						className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
							user.accountType === "PREMIUM"
								? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
								: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
						}`}
					>
						{user.accountType}
					</span>
				</div>
			</div>

			<div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
				<div className="text-sm text-gray-600 dark:text-gray-300">
					<p>{user.totalStrategies} Strategies</p>
					<p>{user.totalTrades} Trades</p>
				</div>
				<div className="flex items-center gap-2">
					{/* Play/Pause Toggle */}
					<button
						type="button"
						onClick={() => onStatusToggle(userId, user.status)}
						className={`p-2 rounded-lg transition-all ${
							user.status === "active"
								? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400"
								: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
						}`}
						title={
							user.status === "active"
								? "Pause User (Make Inactive)"
								: "Activate User"
						}
					>
						{user.status === "active" ? (
							<Pause className="w-4 h-4" />
						) : (
							<Play className="w-4 h-4" />
						)}
					</button>
					{onEdit && (
						<button
							type="button"
							onClick={() => onEdit(user)}
							className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
							title="Edit User"
						>
							<Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(user)}
							className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
							title="Delete User"
						>
							<Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
						</button>
					)}
				</div>
			</div>
		</motion.div>
	);
}

