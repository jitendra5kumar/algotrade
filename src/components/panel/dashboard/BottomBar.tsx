"use client";

import { motion } from "framer-motion";
import { BarChart3, Home, TrendingUp, User, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomBar() {
	const pathname = usePathname();

	const navItems = [
		{
			id: "dashboard",
			label: "Home",
			icon: Home,
			href: "/dashboard",
		},
		{
			id: "connect-broker",
			label: "Broker",
			icon: Zap,
			href: "/dashboard/connect-broker",
		},
		{
			id: "algo-trading",
			label: "Trading",
			icon: TrendingUp,
			href: "/dashboard/algo-trading",
		},
		{
			id: "my-account",
			label: "Account",
			icon: User,
			href: "/dashboard/my-account",
		},
		{
			id: "broker-panel",
			label: "Panel",
			icon: BarChart3,
			href: "/dashboard/broker-panel",
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.4 }}
			className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 dark:bg-gray-950 dark:border-gray-800 z-50 md:hidden"
		>
			<div className="max-w-7xl mx-auto px-4 py-2">
				<div className="flex items-center justify-around">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						return (
							<Link key={item.id} href={item.href}>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									className={`flex flex-col items-center gap-1 p-2 transition-colors ${
										isActive
											? "text-green-600 dark:text-green-400"
											: "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
									}`}
								>
									<Icon size={20} />
									<span className="text-[10px] font-medium">{item.label}</span>
								</motion.button>
							</Link>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
}

