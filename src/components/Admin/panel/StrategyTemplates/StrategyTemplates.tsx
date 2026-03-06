"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import * as api from "@/lib/strategy-template-api";
import StrategyTemplateCard from "./StrategyTemplateCard";
import StrategyTemplateFilters from "./StrategyTemplateFilters";
import StrategyTemplateModal from "./StrategyTemplateModal";
import StrategyTemplatePagination from "./StrategyTemplatePagination";
import type { FormData, StrategyTemplate } from "./types";

export default function StrategyTemplates() {
	const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState("ALL");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<StrategyTemplate | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [formData, setFormData] = useState<FormData>({
		name: "",
		description: "",
		type: "NORMAL",
		tags: "normal",
		isVisibleToUsers: true,
		indicators: {
			enabled: [],
			configurations: {},
		},
	});

	useEffect(() => {
		fetchTemplates();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filter, page]);

	const fetchTemplates = async () => {
		try {
			setLoading(true);
			const response = await api.getStrategyTemplates(filter);
			if (response.success) {
				const allTemplates = response.data || [];
				// Client-side pagination (10 per page)
				const startIndex = (page - 1) * 10;
				const endIndex = startIndex + 10;
				setTemplates(allTemplates.slice(startIndex, endIndex));
				setTotalPages(Math.ceil(allTemplates.length / 10));
			}
		} catch (error) {
			console.error("Error fetching templates:", error);
			toast.error("Failed to load templates");
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async () => {
		try {
			let response: any;
			if (editingTemplate) {
				// Update existing template
				response = await api.updateStrategyTemplate(
					editingTemplate?._id,
					formData,
				);
				if (response.success) {
					toast.success("Template updated successfully!");
				}
			} else {
				// Create new template
				response = await api.createStrategyTemplate(formData);
				if (response.success) {
					toast.success("Template created successfully!");
				}
			}

			if (response.success) {
				setShowCreateModal(false);
				setEditingTemplate(null);
				resetForm();
				fetchTemplates();
			} else {
				toast.error(
					response.message ||
						`Failed to ${editingTemplate ? "update" : "create"} template`,
				);
			}
		} catch (error: any) {
			toast.error(
				error.message ||
					`Failed to ${editingTemplate ? "update" : "create"} template`,
			);
		}
	};

	const handleEdit = async (template: StrategyTemplate) => {
		setEditingTemplate(template);
		setFormData({
			name: template.name,
			description: template.description,
			type: template.type,
			tags: template.tags || "normal",
			isVisibleToUsers: template.isVisibleToUsers,
			indicators: {
				enabled: template.indicators?.enabled || [],
				configurations: template.indicators?.configurations || {},
			},
		});
		setShowCreateModal(true);
	};

	const handleDelete = async (id: string, name: string) => {
		if (!window.confirm(`Delete template "${name}"?`)) return;

		try {
			const response = await api.deleteStrategyTemplate(id);
			if (response.success) {
				toast.success("Template deleted successfully!");
				fetchTemplates();
			} else {
				toast.error(response.message || "Failed to delete template");
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to delete template");
		}
	};

	const handleClone = async (id: string, name: string) => {
		try {
			const response = await api.cloneStrategyTemplate(id, `${name} (Copy)`);
			if (response.success) {
				toast.success("Template cloned successfully!");
				fetchTemplates();
			}
		} catch (error) {
			toast.error("Failed to clone template");
		}
	};

	const handleToggleVisibility = async (template: StrategyTemplate) => {
		try {
			const response = await api.updateStrategyTemplate(template._id, {
				isVisibleToUsers: !template.isVisibleToUsers,
			});
			if (response.success) {
				toast.success("Visibility updated!");
				fetchTemplates();
			}
		} catch (error) {
			toast.error("Failed to update visibility");
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			type: "NORMAL",
			tags: "normal",
			isVisibleToUsers: true,
			indicators: {
				enabled: [],
				configurations: {},
			},
		});
	};

	const handleCloseModal = () => {
		setShowCreateModal(false);
		setEditingTemplate(null);
		resetForm();
	};

	const handleFilterChange = (newFilter: string) => {
		setFilter(newFilter);
		setPage(1);
	};

	const filteredTemplates = templates.filter(
		(template: StrategyTemplate) =>
			template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			template.description.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
						Strategy Templates
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Manage strategy templates for users
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreateModal(true)}
					className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition-opacity text-white"
				>
					<Plus className="w-5 h-5" />
					Create Template
				</button>
			</div>

			{/* Filters & Search */}
			<StrategyTemplateFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				filter={filter}
				onFilterChange={handleFilterChange}
			/>

			{/* Templates Grid */}
			{loading ? (
				<div className="text-center py-12 text-gray-400 dark:text-gray-500">
					Loading templates...
				</div>
			) : filteredTemplates.length === 0 ? (
				<div className="text-center py-12 text-gray-400 dark:text-gray-500">
					No templates found. Create your first template!
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredTemplates.map((template) => (
						<StrategyTemplateCard
							key={template._id}
							template={template}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onClone={handleClone}
							onToggleVisibility={handleToggleVisibility}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			<StrategyTemplatePagination
				currentPage={page}
				totalPages={totalPages}
				onPageChange={setPage}
			/>

			{/* Create/Edit Modal */}
			<StrategyTemplateModal
				isOpen={showCreateModal}
				editingTemplate={editingTemplate}
				formData={formData}
				onClose={handleCloseModal}
				onFormDataChange={setFormData}
				onSubmit={handleCreate}
			/>
		</div>
	);
}

