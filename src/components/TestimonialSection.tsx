"use client";

import { motion } from "framer-motion";
import { Quote, Star, TrendingUp, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function TestimonialsSection() {
	const [activeIndex, setActiveIndex] = useState(0);

	const testimonials = [
		{
			name: "Rajesh Kumar",
			role: "Professional Trader",
			city: "Mumbai",
			image: "👨‍💼",
			rating: 5,
			quote:
				"AlgoTrade completely transformed my trading. I went from losing money to making consistent 15% monthly returns. The AI engine is incredibly accurate!",
			impact: "+₹25L in 6 months",
			strategyUsed: "Momentum Trading",
			gradient: "from-blue-500 to-cyan-500",
		},
		{
			name: "Priya Sharma",
			role: "Software Engineer",
			city: "Bangalore",
			image: "👩‍💻",
			rating: 5,
			quote:
				"As a developer, I love the API flexibility. Built custom strategies in Python and executed them flawlessly. Customer support was amazing!",
			impact: "₹12L profits",
			strategyUsed: "Arbitrage",
			gradient: "from-purple-500 to-pink-500",
		},
		{
			name: "Amit Patel",
			role: "Entrepreneur",
			city: "Ahmedabad",
			image: "👨‍🔬",
			rating: 5,
			quote:
				"I had no trading experience but AlgoTrade's beginner guide made everything simple. Now I run 5 strategies simultaneously without stress!",
			impact: "+8% monthly",
			strategyUsed: "Multi-Strategy",
			gradient: "from-green-500 to-emerald-500",
		},
		{
			name: "Neha Gupta",
			role: "Finance Manager",
			city: "Delhi",
			image: "👩‍💼",
			rating: 5,
			quote:
				"The backtesting feature saved me so much. I tested 50+ strategies before going live. Zero surprises, only consistent profits!",
			impact: "+₹18L in 8 months",
			strategyUsed: "Mean Reversion",
			gradient: "from-red-500 to-orange-500",
		},
		{
			name: "Vikram Singh",
			role: "Retired Executive",
			city: "Pune",
			image: "👴",
			rating: 5,
			quote:
				"24/7 automated trading means I don't have to stare at screens anymore. AlgoTrade literally makes money while I sleep!",
			impact: "+₹30L/year",
			strategyUsed: "Trend Following",
			gradient: "from-indigo-500 to-blue-500",
		},
		{
			name: "Anjali Verma",
			role: "Content Creator",
			city: "Chennai",
			image: "👩‍🎓",
			rating: 4.5,
			quote:
				"Started with ₹50K, now managing ₹20L portfolio. The educational resources and community support made all the difference!",
			impact: "400x portfolio growth",
			strategyUsed: "Scalping",
			gradient: "from-yellow-500 to-orange-500",
		},
	];

	useEffect(() => {
		const interval = setInterval(() => {
			setActiveIndex((prev) => (prev + 1) % testimonials.length);
		}, 6000);
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.15 },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.6 },
		},
	};

	return (
		<section className="py-20 md:py-32 bg-white dark:bg-gray-950">
			<div className="max-w-7xl mx-auto px-6 md:px-12">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<div className="flex items-center justify-center gap-2 mb-4">
						<TrendingUp className="text-green-600" size={28} />
						<span className="text-green-600 font-bold text-lg">
							SUCCESS STORIES
						</span>
					</div>
					<h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 dark:text-gray-100">
						What Our Traders
						<span className="text-green-600"> Are Achieving</span>
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-300">
						Join 50,000+ traders who&apos;ve transformed their finances with
						Gotrade					</p>
				</motion.div>

				{/* Featured Testimonial */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="mb-16"
				>
					<motion.div
						key={activeIndex.toString()}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.6 }}
						className="bg-gradient-to-br from-gray-50 to-green-50 border-2 border-green-300 rounded-3xl p-12 md:p-16 dark:from-gray-900 dark:to-gray-900 dark:border-green-800"
					>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Left - Profile */}
							<div className="flex flex-col items-center md:items-start justify-between">
								<div>
									<motion.div
										animate={{ scale: [1, 1.1, 1] }}
										transition={{ duration: 2, repeat: Infinity }}
										className="text-7xl mb-4"
									>
										{testimonials[activeIndex].image}
									</motion.div>
								<h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
										{testimonials[activeIndex].name}
									</h3>
								<p className="text-gray-600 font-semibold dark:text-gray-300">
										{testimonials[activeIndex].role}
									</p>
								<p className="text-gray-500 text-sm dark:text-gray-400">
										📍 {testimonials[activeIndex].city}
									</p>
								</div>

								{/* Rating */}
								<div className="flex items-center gap-2 mt-6 md:mt-0">
									<div className="flex gap-1">
										{Array.from({ length: 5 }).map((_, i) => (
											<motion.div
												key={i.toString()}
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{ delay: i * 0.1 }}
											>
												<Star
													size={20}
													className={
														i < testimonials[activeIndex].rating
															? "fill-yellow-400 text-yellow-400"
															: "fill-gray-300 text-gray-300"
													}
												/>
											</motion.div>
										))}
									</div>
							<span className="font-bold text-gray-900 dark:text-gray-100">
										{testimonials[activeIndex].rating}
									</span>
								</div>
							</div>

							{/* Middle - Quote */}
							<div className="flex flex-col items-center md:col-span-2">
								<Quote size={40} className="text-green-500 opacity-30 mb-4" />
							<p className="text-2xl font-bold text-gray-900 text-center mb-6 leading-relaxed dark:text-gray-100">
									&quot;{testimonials[activeIndex].quote}&quot;
								</p>

								{/* Impact Stats */}
								<div className="flex gap-6 flex-wrap justify-center mt-8 pt-8 border-t border-green-300 dark:border-green-800">
									<motion.div
										whileHover={{ scale: 1.05 }}
										className="text-center"
									>
										<p className="text-3xl font-black text-green-600">
											{testimonials[activeIndex].impact}
										</p>
									<p className="text-sm text-gray-600 font-semibold dark:text-gray-300">
											Overall Impact
										</p>
									</motion.div>
									<div className="w-1 bg-gray-300 opacity-30"></div>
									<motion.div
										whileHover={{ scale: 1.05 }}
										className="text-center"
									>
										<div className="flex items-center justify-center gap-2 mb-1">
											<Zap size={20} className="text-green-600" />
									<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
												{testimonials[activeIndex].strategyUsed}
											</p>
										</div>
										<p className="text-sm text-gray-600 font-semibold">
											Strategy Used
										</p>
									</motion.div>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Navigation Dots */}
					<div className="flex justify-center gap-2 mt-8">
						{testimonials.map((_, idx) => (
							<motion.button
								key={idx.toString()}
								onClick={() => setActiveIndex(idx)}
								animate={{
									scale: activeIndex === idx ? 1.2 : 1,
									backgroundColor: activeIndex === idx ? "#16a34a" : "#d1d5db",
								}}
								className="w-3 h-3 rounded-full transition-all duration-300"
							/>
						))}
					</div>
				</motion.div>

				{/* CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.5 }}
					className="mt-16 text-center"
				>
						<p className="text-gray-600 text-lg mb-6 dark:text-gray-300">
						Ready to join our community of successful traders?
					</p>
					<motion.div
						className="flex gap-4 justify-center flex-wrap"
						whileHover={{ scale: 1.02 }}
					>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all text-lg"
						>
							Start Trading Today
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="px-10 py-4 border-2 border-green-600 text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all text-lg dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950"
						>
							View More Stories
						</motion.button>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
