"use client";

import { ContactInfo } from "./types";

interface ContactInfoCardsProps {
	contactInfo: ContactInfo;
}

export default function ContactInfoCards({
	contactInfo,
}: ContactInfoCardsProps) {
	return (
		<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
			<div className="p-4 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
				<div className="text-2xl mb-2">📧</div>
				<h4 className="font-bold text-gray-900 mb-1 dark:text-gray-100">
					Email
				</h4>
				<p className="text-sm text-gray-600 dark:text-gray-300">
					{contactInfo.email}
				</p>
			</div>
			<div className="p-4 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
				<div className="text-2xl mb-2">📞</div>
				<h4 className="font-bold text-gray-900 mb-1 dark:text-gray-100">
					Phone
				</h4>
				<p className="text-sm text-gray-600 dark:text-gray-300">
					{contactInfo.phone}
				</p>
			</div>
			<div className="p-4 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
				<div className="text-2xl mb-2">⏰</div>
				<h4 className="font-bold text-gray-900 mb-1 dark:text-gray-100">
					Hours
				</h4>
				<p className="text-sm text-gray-600 dark:text-gray-300">
					{contactInfo.hours}
				</p>
			</div>
		</div>
	);
}

