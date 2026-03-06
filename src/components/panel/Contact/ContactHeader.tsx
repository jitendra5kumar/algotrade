"use client";

interface ContactHeaderProps {}

export default function ContactHeader({}: ContactHeaderProps) {
	return (
		<div className="mb-6 lg:mb-8">
			<h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 dark:text-gray-100">
				Contact Support
			</h1>
			<p className="text-sm lg:text-base text-gray-600 font-medium dark:text-gray-300">
				Get in touch with our support team
			</p>
		</div>
	);
}

