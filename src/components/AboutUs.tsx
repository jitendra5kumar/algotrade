"use client";
import { motion } from "framer-motion";
import { Heart, Rocket, Target, Users } from "lucide-react";
import Image from "next/image";

export default function AboutUsSection() {
	const values = [
		{
			icon: Rocket,
			title: "Innovation First",
			desc: "We push boundaries and challenge the status quo",
			gradient: "from-blue-500 to-cyan-500",
			color: "text-blue-600",
		},
		{
			icon: Heart,
			title: "Trader Centric",
			desc: "Every decision is driven by trader needs",
			gradient: "from-red-500 to-pink-500",
			color: "text-red-600",
		},
		{
			icon: Target,
			title: "Precision & Speed",
			desc: "Millisecond accuracy in every execution",
			gradient: "from-green-500 to-emerald-500",
			color: "text-green-600",
		},
		{
			icon: Users,
			title: "Community Driven",
			desc: "Growing together with our trader community",
			gradient: "from-purple-500 to-pink-500",
			color: "text-purple-600",
		},
	];

	const timeline = [
		{
			year: "2020",
			milestone: "Founded AlgoTrade",
			desc: "Started with a vision to democratize algo trading",
		},
		{
			year: "2021",
			milestone: "10K Traders",
			desc: "Crossed 10,000 active traders on platform",
		},
		{
			year: "2022",
			milestone: "₹100B Volume",
			desc: "Achieved milestone of 100B daily trading volume",
		},
		{
			year: "2023",
			milestone: "AI Integration",
			desc: "Launched neural network-based strategy engine",
		},
		{
			year: "2024",
			milestone: "Global Expansion",
			desc: "Extended services to international markets",
		},
		{
			year: "2025",
			milestone: "Market Leader",
			desc: "Became #1 algo trading platform in India",
		},
	];

	return (
		<section className="py-20 md:py-32 bg-white dark:bg-gray-950">
			<div className="max-w-7xl mx-auto px-6 md:px-12">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="text-center mb-20"
				>
					<motion.h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 dark:text-gray-100">
						About{" "}
						<span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
							Gotrade						</span>
					</motion.h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 dark:text-gray-300">
						Building the future of algorithmic trading in India
					</p>

					{/* Image Section */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mt-12"
					>
						<div className="relative rounded-3xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
							<Image
								src="/images/about-us.png"
								width={1000}
								height={1000}
								alt="About AlgoTrade"
								className="w-full h-auto object-cover"
							/>
						</div>
					</motion.div>
				</motion.div>

				{/* Mission & Vision */}
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20"
				>
					{/* Mission */}
					<motion.div whileHover={{ y: -10 }} className="group relative">
					<div className="absolute inset-0 bg-gradient-to-br from-green-200 to-blue-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-all duration-300 dark:from-emerald-900/30 dark:to-sky-900/30"></div>
					<div className="relative bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 group-hover:border-green-400 p-10 rounded-2xl transition-all duration-300 dark:from-gray-900 dark:to-gray-900 dark:border-green-800 dark:group-hover:border-green-500">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
								className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6"
							>
								<Rocket size={32} className="text-white" />
							</motion.div>
						<h3 className="text-3xl font-bold text-gray-900 mb-4 dark:text-gray-100">
								Our Mission
							</h3>
						<p className="text-lg text-gray-700 leading-relaxed dark:text-gray-300">
								Empower every trader in India with institutional-grade
								algorithmic trading tools. We believe trading should be
								intelligent, automated, and accessible to everyone. Our mission
								is to democratize quantitative trading and help traders maximize
								returns while minimizing risk.
							</p>
						</div>
					</motion.div>

					{/* Vision */}
					<motion.div whileHover={{ y: -10 }} className="group relative">
					<div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-all duration-300 dark:from-purple-900/30 dark:to-pink-900/30"></div>
					<div className="relative bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 group-hover:border-purple-400 p-10 rounded-2xl transition-all duration-300 dark:from-gray-900 dark:to-gray-900 dark:border-purple-800 dark:group-hover:border-purple-500">
							<motion.div
								animate={{ rotate: -360 }}
								transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
								className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6"
							>
								<Target size={32} className="text-white" />
							</motion.div>
						<h3 className="text-3xl font-bold text-gray-900 mb-4 dark:text-gray-100">
								Our Vision
							</h3>
						<p className="text-lg text-gray-700 leading-relaxed dark:text-gray-300">
								Become the world&apos;s most trusted algorithmic trading
								platform. We envision a future where AI and machine learning
								transform how traders operate, where technology eliminates human
								emotion from trading, and where every trader has access to tools
								that were previously only available to hedge funds and
								institutions.
							</p>
						</div>
					</motion.div>
				</motion.div>

				{/* Core Values */}
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					className="mb-20"
				>
					<h3 className="text-4xl font-bold text-center text-gray-900 mb-12 dark:text-gray-100">
						Our Core Values
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{values.map((value, idx) => {
							const Icon = value.icon;
							return (
								<motion.div
									key={value.title + idx.toString()}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: idx * 0.1 }}
									whileHover={{ y: -10 }}
									className="group relative"
								>
									<div
										className={`absolute inset-0 bg-gradient-to-br ${value.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-all duration-300`}
									></div>
									<div className="relative bg-white border-2 border-gray-200 group-hover:border-gray-300 p-8 rounded-2xl transition-all duration-300 dark:bg-gray-900 dark:border-gray-700 dark:group-hover:border-gray-600">
										<motion.div
											animate={{ y: [0, -5, 0] }}
											transition={{
												duration: 2,
												repeat: Infinity,
												delay: idx * 0.2,
											}}
											className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-xl flex items-center justify-center mb-4`}
										>
											<Icon size={28} className="text-white" />
										</motion.div>
										<h4 className="text-xl font-bold text-gray-900 mb-2 dark:text-gray-100">
											{value.title}
										</h4>
										<p className="text-gray-600 dark:text-gray-300">{value.desc}</p>
									</div>
								</motion.div>
							);
						})}
					</div>
				</motion.div>

				{/* Timeline */}
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					className="mb-20"
				>
					<h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8 md:mb-12 dark:text-gray-100">
						Our Journey
					</h3>
					<div className="relative">
						{/* Timeline Line - Desktop */}
						<div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500 hidden md:block"></div>
						
						{/* Timeline Line - Mobile */}
						<div className="absolute left-4 md:hidden h-full w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500"></div>

						{/* Timeline Items */}
						<div className="space-y-6 md:space-y-12">
							{timeline.map((item, idx) => (
								<motion.div
									key={item.year + idx.toString()}
									initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ delay: idx * 0.1 }}
									className={`flex items-start md:items-center ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
								>
									{/* Mobile Dot */}
									<motion.div
										animate={{ scale: [1, 1.2, 1] }}
										transition={{
											duration: 2,
											repeat: Infinity,
											delay: idx * 0.3,
										}}
										className="absolute left-2 md:hidden w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-2 border-white shadow-lg dark:border-gray-900"
									></motion.div>

									{/* Content */}
									<motion.div
										whileHover={{ scale: 1.02 }}
										className={`w-full md:w-5/12 ml-8 md:ml-0 px-4 py-4 md:px-6 md:py-6 bg-gradient-to-br from-gray-50 to-green-50 border-2 border-gray-200 hover:border-green-400 rounded-lg md:rounded-xl transition-all duration-300 dark:from-gray-900 dark:to-gray-900 dark:border-gray-700 dark:hover:border-green-500`}
									>
										<div className="flex items-center gap-2 mb-1.5 md:mb-2">
											<span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
												{item.year}
											</span>
										</div>
										<h4 className="text-base md:text-xl font-bold text-gray-900 mb-1.5 md:mb-2 dark:text-gray-100">
											{item.milestone}
										</h4>
										<p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{item.desc}</p>
									</motion.div>

									{/* Desktop Dot */}
									<motion.div
										animate={{ scale: [1, 1.2, 1] }}
										transition={{
											duration: 2,
											repeat: Infinity,
											delay: idx * 0.3,
										}}
										className="hidden md:block w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-4 border-white shadow-lg dark:border-gray-900"
									></motion.div>

									{/* Empty Space */}
									<div className="hidden md:block w-full md:w-5/12"></div>
								</motion.div>
							))}
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
