"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UserFilters from "./UserFilters";
import UserTableRow from "./UserTableRow";
import UserCard from "./UserCard";
import EditUserModal from "./EditUserModal";
import DeleteUserModal from "./DeleteUserModal";
import type { User } from "./types";

export default function UserManagement() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [deletingUser, setDeletingUser] = useState<User | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const { getAllUsers } = await import("@/lib/admin-api");
			const response = await getAllUsers();

			if (response.success) {
				setUsers(response.data || []);
			} else {
				toast.error(response.message || "Failed to load users");
			}
		} catch (error: any) {
			console.error("Error fetching users:", error);
			toast.error(error.message || "Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	const handleStatusToggle = async (userId: string, currentStatus: string) => {
		const newStatus = currentStatus === "active" ? "inactive" : "active";
		const loadingToast = toast.loading("Updating user status...");

		try {
			const { updateUserStatus } = await import("@/lib/admin-api");
			const response = await updateUserStatus(userId, newStatus);

			if (response.success) {
				setUsers((prev) =>
					prev.map((user) => {
						const id = user.id || user._id || "";
						return id === userId
							? { ...user, status: newStatus as "active" | "inactive" }
							: user;
					}),
				);
				toast.success(
					`User ${newStatus === "active" ? "activated" : "deactivated"}`,
					{ id: loadingToast },
				);
			} else {
				toast.error(response.message || "Failed to update status", {
					id: loadingToast,
				});
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to update status", {
				id: loadingToast,
			});
		}
	};

	const handleEdit = (user: User) => {
		setEditingUser(user);
		setIsEditModalOpen(true);
	};

	const handleDelete = (user: User) => {
		setDeletingUser(user);
		setIsDeleteModalOpen(true);
	};

	const handleEditSuccess = () => {
		fetchUsers(); // Refresh user list
	};

	const handleDeleteSuccess = () => {
		fetchUsers(); // Refresh user list
	};

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesFilter =
			filterStatus === "all" || user.status === filterStatus;

		return matchesSearch && matchesFilter;
	});

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
						User Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						{users.length} total users
					</p>
				</div>
			</div>

			{/* Filters */}
			<UserFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				filterStatus={filterStatus}
				onFilterStatusChange={setFilterStatus}
			/>

			{/* Users Table - Desktop */}
			<div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
							<tr>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									User
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Contact
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Account
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Activity
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Status
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
							{filteredUsers.map((user) => (
								<UserTableRow
									key={user.id || user._id}
									user={user}
									onStatusToggle={handleStatusToggle}
									onEdit={handleEdit}
									onDelete={handleDelete}
								/>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Users Cards - Mobile */}
			<div className="lg:hidden space-y-4">
				{filteredUsers.map((user) => (
					<UserCard
						key={user.id || user._id}
						user={user}
						onStatusToggle={handleStatusToggle}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				))}
			</div>

			{/* Edit User Modal */}
			<EditUserModal
				user={editingUser}
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setEditingUser(null);
				}}
				onSuccess={handleEditSuccess}
			/>

			{/* Delete User Modal */}
			<DeleteUserModal
				user={deletingUser}
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setDeletingUser(null);
				}}
				onSuccess={handleDeleteSuccess}
			/>
		</div>
	);
}

