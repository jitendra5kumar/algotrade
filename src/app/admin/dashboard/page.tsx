// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import AdminDashboard from "@/components/Admin/panel/AdminDashboard";

export default function AdminDashboardPage() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<AdminDashboard />
		</motion.div>
	);
}
