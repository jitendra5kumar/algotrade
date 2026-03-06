// @ts-nocheck
import api from "./api";

/**
 * Get all strategy templates
 */
export const getStrategyTemplates = async (filter = 'ALL') => {
	try {
		const response = await api.get(`/api/admin/strategy-templates?filter=${filter}`);
		return response;
	} catch (error) {
		console.error("Error fetching strategy templates:", error);
		throw error;
	}
};

/**
 * Get strategy template details
 */
export const getStrategyTemplateDetails = async (id) => {
	try {
		const response = await api.get(`/api/admin/strategy-templates/${id}`);
		return response;
	} catch (error) {
		console.error("Error fetching template details:", error);
		throw error;
	}
};

/**
 * Create strategy template
 */
export const createStrategyTemplate = async (templateData) => {
	try {
		const response = await api.post("/api/admin/strategy-templates", templateData);
		return response;
	} catch (error) {
		console.error("Error creating template:", error);
		throw error;
	}
};

/**
 * Update strategy template
 */
export const updateStrategyTemplate = async (id, updates) => {
	try {
		const response = await api.put(`/api/admin/strategy-templates/${id}`, updates);
		return response;
	} catch (error) {
		console.error("Error updating template:", error);
		throw error;
	}
};

/**
 * Delete strategy template
 */
export const deleteStrategyTemplate = async (id) => {
	try {
		const response = await api.delete(`/api/admin/strategy-templates/${id}`);
		return response;
	} catch (error) {
		console.error("Error deleting template:", error);
		throw error;
	}
};

/**
 * Clone strategy template
 */
export const cloneStrategyTemplate = async (id, name) => {
	try {
		const response = await api.post(`/api/admin/strategy-templates/${id}/clone`, { name });
		return response;
	} catch (error) {
		console.error("Error cloning template:", error);
		throw error;
	}
};

/**
 * Toggle indicator parameter visibility/editability
 */
export const toggleIndicatorParameterVisibility = async (id, indicator, isVisible, isEditable) => {
	try {
		const response = await api.put(
			`/api/admin/strategy-templates/${id}/indicators/${indicator}/visibility`,
			{ isVisible, isEditable }
		);
		return response;
	} catch (error) {
		console.error("Error toggling parameter visibility:", error);
		throw error;
	}
};
