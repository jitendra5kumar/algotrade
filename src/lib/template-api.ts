// @ts-nocheck
import api from './api';

/**
 * Get all visible strategy templates for users
 */
export const getVisibleTemplates = async () => {
	try {
		const response = await api.get('/api/strategies/templates');
		return response;
	} catch (error) {
		console.error('Error fetching templates:', error);
		throw error;
	}
};

/**
 * Get template details with editable parameters only
 */
export const getTemplateDetails = async (id) => {
	try {
		const response = await api.get(`/api/strategies/templates/${id}`);
		return response;
	} catch (error) {
		console.error('Error fetching template details:', error);
		throw error;
	}
};
