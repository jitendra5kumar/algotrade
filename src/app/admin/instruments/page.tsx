// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import InstrumentsManagement from "@/components/Admin/panel/InstrumentsManagement";

export default function AdminInstrumentsPage() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<InstrumentsManagement />
		</motion.div>
	);
}
