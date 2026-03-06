"use client";

interface ErrorStateProps {
	error: string;
	onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-center dark:bg-red-900/20 dark:border-red-800">
				<p className="text-red-600 text-sm font-medium dark:text-red-400">
					Error: {error}
				</p>
				<button
					onClick={onRetry}
					className="mt-3 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm dark:bg-red-700 dark:hover:bg-red-800"
				>
					Retry
				</button>
			</div>
		</div>
	);
}

