"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { ContactForm as ContactFormType } from "./types";

interface ContactFormProps {
	contactForm: ContactFormType;
	onInputChange: (field: string, value: string) => void;
	onSubmit: () => void;
}

export default function ContactForm({
	contactForm,
	onInputChange,
	onSubmit,
}: ContactFormProps) {
	return (
		<div className="space-y-4 mb-6">
			{/* Name */}
			<div>
				<label
					htmlFor="name"
					className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
				>
					Your Name
				</label>
				<input
					type="text"
					placeholder="Enter your name"
					value={contactForm.name}
					onChange={(e) => onInputChange("name", e.target.value)}
					className="w-full px-3 py-2.5 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-white hover:bg-white focus:bg-white font-medium text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
				/>
			</div>

			{/* Email */}
			<div>
				<label
					htmlFor="email"
					className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
				>
					Email Address
				</label>
				<input
					type="email"
					placeholder="Enter your email"
					value={contactForm.email}
					onChange={(e) => onInputChange("email", e.target.value)}
					className="w-full px-3 py-2.5 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-white hover:bg-white focus:bg-white font-medium text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
				/>
			</div>

			{/* Message */}
			<div>
				<label
					htmlFor="message"
					className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
				>
					Your Message
				</label>
				<textarea
					placeholder="How can we help you?"
					value={contactForm.message}
					onChange={(e) => onInputChange("message", e.target.value)}
					rows={5}
					className="w-full px-3 py-2.5 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-white hover:bg-white focus:bg-white font-medium text-sm text-gray-900 placeholder:text-gray-400 resize-none dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
				/>
			</div>

			{/* Submit Button */}
			<motion.button
				whileHover={{ scale: 1.02, y: -2 }}
				whileTap={{ scale: 0.98 }}
				onClick={onSubmit}
				className="w-full py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group"
			>
				<motion.div
					className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
					animate={{ x: ["-200%", "200%"] }}
					transition={{
						duration: 3,
						repeat: Infinity,
						ease: "linear",
					}}
				/>
				<span className="relative z-10 flex items-center justify-center gap-1.5">
					<Mail size={18} />
					Send Message
				</span>
			</motion.button>
		</div>
	);
}

