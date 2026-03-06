// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import StrategyMonitor from "@/components/Admin/panel/StrategyMonitor";

export default function AdminStrategiesPage() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<StrategyMonitor />
		</motion.div>
	);
}
