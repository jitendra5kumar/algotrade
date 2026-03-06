import { INDICATOR_ICONS, CATEGORY_COLORS } from "./constants";

export const getIndicatorIcon = (name: string): string => {
	return INDICATOR_ICONS[name] || "📊";
};

export const getCategoryColor = (category: string): string => {
	return CATEGORY_COLORS[category] || "gray";
};

export const getDefaultProductType = (exchangeSegment: string): string => {
	if (exchangeSegment === "NSECM" || exchangeSegment === "BSECM") {
		return "cnc"; // Cash market default to CNC
	} else if (exchangeSegment === "NSEFO" || exchangeSegment === "BSEFO" || exchangeSegment === "MCXFO") {
		return "nrml"; // F&O default to NRML
	}
	return "nrml";
};

export const normalizeTemplateId = (templateId: any): string | null => {
	if (!templateId) return null;
	
	if (typeof templateId === 'string') {
		return templateId;
	} else if (templateId.$oid) {
		return templateId.$oid;
	} else if (templateId._id) {
		return typeof templateId._id === 'string' 
			? templateId._id 
			: templateId._id.toString();
	} else if (typeof templateId.toString === 'function') {
		return templateId.toString();
	}
	
	return String(templateId);
};

export const findMatchingTemplate = (templates: any[], templateId: string): any => {
	const normalizedTemplateId = String(templateId).trim();
	
	return templates.find((t) => {
		const tId = t._id?.toString() || t._id || t.id;
		const normalizedTId = String(tId).trim();
		return normalizedTId === normalizedTemplateId || String(tId) === String(templateId);
	});
};

