"use client";

import { AnimatePresence, motion } from "framer-motion";
import ContactDrawerHeader from "./ContactDrawerHeader";
import ContactForm from "./ContactForm";
import FAQSection from "./FAQSection";
import SupportInfo from "./SupportInfo";
import { ContactForm as ContactFormType, FAQ } from "./types";

interface ContactDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	contactForm: ContactFormType;
	handleContactInputChange: (field: string, value: string) => void;
	handleContactSubmit: () => void;
}

const faqs: FAQ[] = [
	{
		question: "How do I connect my broker account?",
		answer:
			'Go to "Connect Broker" menu, select your broker, and enter your API credentials. We support Anand Rathi, Jainam, and Upstox.',
	},
	{
		question: "What are the trading hours?",
		answer:
			"Our algorithms work 24/7, but live trading happens during market hours (9:15 AM - 3:30 PM IST for NSE/BSE).",
	},
	{
		question: "How do I start a strategy?",
		answer:
			'After connecting your broker, go to "Algo Trading" and click on any strategy card to configure and start trading.',
	},
	{
		question: "Is my data secure?",
		answer:
			"Yes! We use bank-grade 256-bit encryption for all data. Your credentials are never shared with third parties.",
	},
	{
		question: "How do I withdraw profits?",
		answer:
			"All profits are directly credited to your linked broker account. You can withdraw from there anytime.",
	},
];

export default function ContactDrawer({
	isOpen,
	onClose,
	contactForm,
	handleContactInputChange,
	handleContactSubmit,
}: ContactDrawerProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
					/>

					{/* Drawer */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
						className="fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-lg bg-gray-50 shadow-2xl z-50 overflow-y-auto dark:bg-gray-950"
					>
						<div className="p-4 sm:p-5">
							<ContactDrawerHeader onClose={onClose} />

							<ContactForm
								contactForm={contactForm}
								onInputChange={handleContactInputChange}
								onSubmit={handleContactSubmit}
							/>

							<FAQSection faqs={faqs} />

							<SupportInfo />
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

