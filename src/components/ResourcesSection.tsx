"use client";

import { motion } from "framer-motion";
import { Cpu, Flame, Gauge, Lock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function ExtraordinarySection() {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [activeCard, setActiveCard] = useState(0);

	useEffect(() => {
		const handleMouseMove = (e) => {
			setMousePosition({ x: e.clientX, y: e.clientY });
		};
		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	const features = [
		{
			icon: Cpu,
			title: "AI-Powered Algorithms",
			desc: "Neural networks that adapt to market conditions in real-time",
			gradient: "from-pink-500 via-red-500 to-orange-500",
			number: "01",
		},
		{
			icon: Zap,
			title: "Lightning Speed Execution",
			desc: "Execute trades with in milliseconds, not seconds",
			gradient: "from-cyan-500 via-blue-500 to-purple-500",
			number: "02",
		},
		{
			icon: Gauge,
			title: "Risk Intelligence",
			desc: "Dynamic position sizing & drawdown protection",
			gradient: "from-emerald-500 via-green-500 to-teal-500",
			number: "03",
		},
		{
			icon: Lock,
			title: "Military Grade Security",
			desc: "End-to-end encryption with regulatory compliance",
			gradient: "from-indigo-500 via-purple-500 to-pink-500",
			number: "04",
		},
		{
			icon: Flame,
			title: "Market Domination",
			desc: "Leverage AI to stay ahead of 99% traders of the market",
			gradient: "from-yellow-500 via-orange-500 to-red-500",
			number: "05",
		},
	];

	return (
		<section className="relative min-h-screen bg-white text-gray-900 overflow-hidden py-20">
			<div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="text-center mb-20"
				>
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
						className="inline-block mb-4"
					>
						<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-green-500 border-r-green-500"></div>
					</motion.div>
					<h2 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
						NEXT-GEN TRADING
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						Experience the future of algorithmic trading with AI that
						doesn&apos;t just follow trends—it creates them
					</p>
				</motion.div>

				{/* Interactive Feature Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
					{/* First 3 cards */}
					<div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{features.slice(0, 3).map((feature, idx) => {
							const Icon = feature.icon;
							const isActive = activeCard === idx;

							return (
								<motion.div
									key={feature.title + idx.toString()}
									onMouseEnter={() => setActiveCard(idx)}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.6, delay: idx * 0.1 }}
									className="group relative"
								>
									{/* Card */}
									<motion.div
										animate={{
											y: isActive ? -10 : 0,
											scale: isActive ? 1.05 : 1,
										}}
										className="relative bg-white border border-gray-200 group-hover:border-gray-300 p-8 rounded-2xl transition-all duration-300 shadow-lg"
									>
										{/* Number badge */}
										<div
											className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center font-black text-sm text-black`}
										>
											{feature.number}
										</div>

										{/* Icon */}
										<motion.div
											animate={{
												y: isActive ? -10 : 0,
												scale: isActive ? 1.2 : 1,
											}}
											className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:shadow-2xl transition-all duration-300`}
										>
											<Icon size={32} className="text-white" />
										</motion.div>

										{/* Content */}
										<h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all">
											{feature.title}
										</h3>
										<p className="text-gray-600 group-hover:text-gray-700 transition-colors">
											{feature.desc}
										</p>

										{/* Bottom line animation */}
										<motion.div
											initial={{ scaleX: 0 }}
											whileInView={{ scaleX: isActive ? 1 : 0 }}
											transition={{ duration: 0.5 }}
											className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-b-2xl"
											style={{ originX: 0 }}
										></motion.div>
									</motion.div>
								</motion.div>
							);
						})}
					</div>

					{/* Last 2 cards centered */}
					<div className="lg:col-span-3 flex justify-center gap-6">
						{features.slice(3).map((feature, idx) => {
							const Icon = feature.icon;
							const actualIdx = idx + 3;
							const isActive = activeCard === actualIdx;

							return (
								<motion.div
									key={actualIdx}
									onMouseEnter={() => setActiveCard(actualIdx)}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.6, delay: actualIdx * 0.1 }}
									className="group relative"
								>
									{/* Card */}
									<motion.div
										animate={{
											y: isActive ? -10 : 0,
											scale: isActive ? 1.05 : 1,
										}}
										className="relative bg-white border border-gray-200 group-hover:border-gray-300 p-8 rounded-2xl transition-all duration-300 shadow-lg"
									>
										{/* Number badge */}
										<div
											className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center font-black text-sm text-black`}
										>
											{feature.number}
										</div>

										{/* Icon */}
										<motion.div
											animate={{
												y: isActive ? -10 : 0,
												scale: isActive ? 1.2 : 1,
											}}
											className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:shadow-2xl transition-all duration-300`}
										>
											<Icon size={32} className="text-white" />
										</motion.div>

										{/* Content */}
										<h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all">
											{feature.title}
										</h3>
										<p className="text-gray-600 group-hover:text-gray-700 transition-colors">
											{feature.desc}
										</p>

										{/* Bottom line animation */}
										<motion.div
											initial={{ scaleX: 0 }}
											whileInView={{ scaleX: isActive ? 1 : 0 }}
											transition={{ duration: 0.5 }}
											className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-b-2xl"
											style={{ originX: 0 }}
										></motion.div>
									</motion.div>
								</motion.div>
							);
						})}
					</div>
				</div>

				{/* Floating particles */}
				{Array.from({ length: 20 }).map((_, i) => (
					<motion.div
						key={i.toString()}
						className="absolute w-1 h-1 bg-green-500 rounded-full opacity-50"
						animate={{
							x: Math.random() * 1000 - 500,
							y: Math.random() * 1000 - 500,
							opacity: [0, 1, 0],
						}}
						transition={{
							duration: Math.random() * 3 + 2,
							repeat: Infinity,
							delay: Math.random() * 5,
						}}
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
						}}
					/>
				))}
			</div>
		</section>
	);
}
