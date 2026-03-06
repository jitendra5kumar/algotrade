// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import TradeHistory from "@/components/Admin/panel/TradeHistory";

export default function AdminTradesPage() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<TradeHistory />
		</motion.div>
	);
}
