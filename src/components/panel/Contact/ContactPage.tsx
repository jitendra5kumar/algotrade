"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ChatDrawer from "../ChatDrawer";
import ContactHeader from "./ContactHeader";
import ContactInfoCards from "./ContactInfoCards";
import { ContactInfo } from "./types";

const contactInfo: ContactInfo = {
	email: "support@algotrade.com",
	phone: "+91 1234567890",
	hours: "Mon-Fri: 9AM-6PM IST",
};

export default function ContactPage() {
	const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

	// Auto-open chat drawer when page loads
	useEffect(() => {
		setChatDrawerOpen(true);
	}, []);

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="p-4 sm:p-6 lg:p-8"
			>
				<ContactHeader />

				<div className="bg-white border-2 border-gray-200 rounded-2xl p-6 lg:p-8 shadow-lg dark:bg-gray-900 dark:border-gray-800">
					<div className="text-center py-12">
						<div className="text-6xl mb-4">💬</div>
						<h3 className="text-xl font-bold text-gray-900 mb-4 dark:text-gray-100">
							Chat with Us
						</h3>
						<p className="text-gray-600 mb-6 dark:text-gray-300">
							Our support team is here to help you with any questions
						</p>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setChatDrawerOpen(true)}
							className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all dark:from-green-600 dark:to-emerald-700"
						>
							Open Chat
						</motion.button>
					</div>

					<ContactInfoCards contactInfo={contactInfo} />
				</div>
			</motion.div>

			<ChatDrawer
				isOpen={chatDrawerOpen}
				onClose={() => setChatDrawerOpen(false)}
			/>
		</>
	);
}

