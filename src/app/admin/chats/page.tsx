// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import AdminChats from "@/components/Admin/panel/AdminChats";

export default function AdminChatsPage() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<AdminChats />
		</motion.div>
	);
}
