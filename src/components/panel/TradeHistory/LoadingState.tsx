"use client";

export default function LoadingState() {
	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="flex items-center justify-center h-56">
				<div className="text-center">
					<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
					<p className="text-gray-600 text-sm font-medium dark:text-gray-300">
						Loading trades...
					</p>
				</div>
			</div>
		</div>
	);
}

