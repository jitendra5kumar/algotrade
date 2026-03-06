"use client";

import TradeHistoryTableRow from "./TradeHistoryTableRow";
import { Trade } from "./types";

interface TradeHistoryTableProps {
	trades: Trade[];
}

export default function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
	return (
		<div className="hidden lg:block bg-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg dark:bg-gray-950 dark:border-gray-800">
			{/* Table Header */}
			<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-gray-200 px-4 py-3 dark:from-gray-900 dark:to-gray-900 dark:border-gray-800">
				<div className="grid grid-cols-12 gap-3 font-bold text-xs text-gray-700 dark:text-gray-300">
					<div className="col-span-1">Symbol</div>
					<div className="col-span-1">Strategy</div>
					<div className="col-span-1">Type</div>
					<div className="col-span-1">Entry</div>
					<div className="col-span-1">Exit</div>
					<div className="col-span-1">Qty</div>
					<div className="col-span-1">P&L</div>
					<div className="col-span-1">%</div>
					<div className="col-span-2">Entry Date & Time</div>
					<div className="col-span-2">Exit Date & Time</div>
					<div className="col-span-1">Status</div>
				</div>
			</div>

			{/* Table Body */}
			<div className="divide-y divide-gray-200 dark:divide-gray-800">
				{trades.length > 0 ? (
					trades.map((trade, idx) => (
						<TradeHistoryTableRow key={trade.id} trade={trade} index={idx} />
					))
				) : (
					<div className="px-4 py-10 text-center">
						<p className="text-gray-500 text-sm font-medium dark:text-gray-400">
							No trades found
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

