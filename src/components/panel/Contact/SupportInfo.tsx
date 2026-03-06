"use client";

interface SupportInfoProps {
	phoneNumber?: string;
}

export default function SupportInfo({
	phoneNumber = "1800-123-4567",
}: SupportInfoProps) {
	return (
		<div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl dark:from-gray-900 dark:to-gray-900 dark:border-green-800">
			<div className="flex items-start gap-2 sm:gap-2.5">
				<div className="text-lg sm:text-xl">💬</div>
				<div>
					<h4 className="font-bold text-gray-900 mb-1 text-xs sm:text-sm dark:text-gray-100">
						24/7 Support Available
					</h4>
					<p className="text-xs text-gray-700 leading-relaxed dark:text-gray-300">
						Our support team typically responds within 2 hours. For urgent
						issues, call us at{" "}
						<span className="font-bold text-green-600 dark:text-green-400">
							{phoneNumber}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
}

