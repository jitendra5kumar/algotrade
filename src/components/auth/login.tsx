"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { authAPI, saveAuthData } from "@/lib/auth-api";

const REMEMBER_ME_KEY = "rememberedLogin";
const REMEMBER_ME_EMAIL_KEY = "rememberedEmail";
const REMEMBER_ME_PASSWORD_KEY = "rememberedPassword";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [focusedInput, setFocusedInput] = useState(null);
	const router = useRouter();

	// Load saved credentials on component mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			const remembered = localStorage.getItem(REMEMBER_ME_KEY) === "true";
			if (remembered) {
				const savedEmail = localStorage.getItem(REMEMBER_ME_EMAIL_KEY);
				const savedPassword = localStorage.getItem(REMEMBER_ME_PASSWORD_KEY);
				if (savedEmail && savedPassword) {
					setEmail(savedEmail);
					setPassword(savedPassword);
					setRememberMe(true);
				}
			}
		}
	}, []);

	const handleLogin = async () => {
		// Validation
		if (!email || !password) {
			toast.error("Please enter email and password");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		if (password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		setIsLoading(true);
		const loadingToast = toast.loading("Logging you in...");

		try {
			const response = await authAPI.login(email, password);
			// console.log("login response", response);

			// Save auth data
			saveAuthData(response.data.accessToken, response.data.user);

			// Handle remember me functionality
			if (typeof window !== "undefined") {
				if (rememberMe) {
					// Save credentials
					localStorage.setItem(REMEMBER_ME_KEY, "true");
					localStorage.setItem(REMEMBER_ME_EMAIL_KEY, email);
					localStorage.setItem(REMEMBER_ME_PASSWORD_KEY, password);
				} else {
					// Clear saved credentials
					localStorage.removeItem(REMEMBER_ME_KEY);
					localStorage.removeItem(REMEMBER_ME_EMAIL_KEY);
					localStorage.removeItem(REMEMBER_ME_PASSWORD_KEY);
				}
			}

			toast.success(`Welcome back, ${response.data.user.name}! 🎉`, {
				id: loadingToast,
				duration: 5000,
			});

			// Redirect to dashboard
			setTimeout(() => {
				router.push("/dashboard");
			}, 1500);
		} catch (error) {
			toast.error(error.message || "Invalid email or password", {
				id: loadingToast,
			});
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			handleLogin();
		}
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.12, delayChildren: 0.2 },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 25 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.7, ease: "easeOut" },
		},
	};

	return (
		<div className="min-h-screen w-full bg-[#f9fafb] dark:bg-gray-950 relative">
			{/* Diagonal Fade Center Grid Background - Light Mode */}
			<div
				className="absolute inset-0 z-0 dark:hidden"
				style={{
					backgroundImage: `
						linear-gradient(to right, #d1d5db 1px, transparent 1px),
						linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
					`,
					backgroundSize: "32px 32px",
					WebkitMaskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
					maskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
				}}
			/>
			{/* Diagonal Fade Center Grid Background - Dark Mode */}
			<div
				className="absolute inset-0 z-0 hidden dark:block"
				style={{
					backgroundImage: `
						linear-gradient(to right, #374151 1px, transparent 1px),
						linear-gradient(to bottom, #374151 1px, transparent 1px)
					`,
					backgroundSize: "32px 32px",
					WebkitMaskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
					maskImage:
						"radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
				}}
			/>

			<div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="w-full max-w-md"
				>
					{/* Logo & Brand */}
					<motion.div
						variants={itemVariants as Variants}
						className="text-center mb-8"
					>
						<motion.div
							whileHover={{ scale: 1.1, rotate: 360 }}
							transition={{ duration: 0.6 }}
							className="inline-block mb-3"
						>
							<div className="w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{
										duration: 20,
										repeat: Infinity,
										ease: "linear",
									}}
									className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
								/>
								<TrendingUp
									size={30}
									className="text-white relative z-10"
									strokeWidth={2.5}
								/>
							</div>
						</motion.div>
						<h1 className="text-3xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
							Gotrade						</h1>
						<p className="text-gray-600 font-medium text-xs dark:text-gray-300">
							Welcome back! Let&apos;s continue trading
						</p>
					</motion.div>

					{/* Main Card */}
					<motion.div
						variants={itemVariants as Variants}
						className="relative group"
					>
						{/* Enhanced Glow Effect */}
						<div className="absolute -inset-2 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-blue-500/30 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

						{/* Card */}
						<div className="relative bg-gray-50 backdrop-blur-2xl border-2 border-gray-200/80 hover:border-green-300 rounded-3xl p-6 shadow-2xl transition-all duration-300 dark:bg-gray-950 dark:border-gray-700 dark:hover:border-green-700">
							{/* Welcome Text */}
							<motion.div variants={itemVariants as Variants} className="mb-5">
								<h2 className="text-2xl font-black text-gray-900 mb-1.5 dark:text-gray-100">
									Welcome Back!
								</h2>
								<p className="text-gray-600 font-medium text-sm dark:text-gray-300">
									Sign in to access your trading dashboard
								</p>
							</motion.div>

							{/* Email Input */}
							<motion.div variants={itemVariants as Variants} className="mb-4">
								<label
									htmlFor="email"
									className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
								>
									Email Address
								</label>
								<motion.div
									animate={{
										scale: focusedInput === "email" ? 1.02 : 1,
										boxShadow:
											focusedInput === "email"
												? "0 8px 30px rgba(16, 185, 129, 0.25)"
												: "0 2px 8px rgba(0, 0, 0, 0.08)",
									}}
									className="relative rounded-xl transition-all duration-300"
								>
									<Mail
										size={18}
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 pointer-events-none"
									/>
									<input
										type="email"
										placeholder="Enter your email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										onFocus={() => setFocusedInput("email" as any)}
										onBlur={() => setFocusedInput(null)}
										onKeyPress={handleKeyPress}
									className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
									/>
								</motion.div>
							</motion.div>

							{/* Password Input */}
							<motion.div variants={itemVariants as Variants} className="mb-4">
								<label
									htmlFor="password"
									className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
								>
									Password
								</label>
								<motion.div
									animate={{
										scale: focusedInput === "password" ? 1.02 : 1,
										boxShadow:
											focusedInput === "password"
												? "0 8px 30px rgba(16, 185, 129, 0.25)"
												: "0 2px 8px rgba(0, 0, 0, 0.08)",
									}}
									className="relative rounded-xl transition-all duration-300"
								>
									<Lock
										size={18}
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 pointer-events-none"
									/>
									<input
										type={showPassword ? "text" : "password"}
										placeholder="Enter your password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										onFocus={() => setFocusedInput("password" as any)}
										onBlur={() => setFocusedInput(null)}
										onKeyPress={handleKeyPress}
									className="w-full pl-10 pr-12 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
									/>
									<motion.button
										whileHover={{ scale: 1.15 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600 transition-colors p-1"
									>
										{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
									</motion.button>
								</motion.div>
							</motion.div>

							{/* Remember & Forgot */}
							<motion.div
								variants={itemVariants as Variants}
								className="flex items-center justify-between mb-5"
							>
								<label className="flex items-center gap-2 cursor-pointer group">
									<div className="relative">
										<input
											type="checkbox"
											checked={rememberMe}
											onChange={(e) => setRememberMe(e.target.checked)}
											className="w-4 h-4 accent-green-600 cursor-pointer rounded border-2 border-gray-300 transition-all"
										/>
									</div>
									<span className="text-gray-700 font-semibold text-sm group-hover:text-green-600 transition-colors dark:text-gray-300">
										Keep me signed in
									</span>
								</label>
								<motion.button
									onClick={() => router.push("/forgot-password")}
									whileHover={{ x: 3 }}
									className="text-green-600 font-bold text-sm hover:text-green-700 transition-all"
								>
									Forgot Password?
								</motion.button>
							</motion.div>

							{/* Login Button */}
							<motion.button
								variants={itemVariants as Variants}
								whileHover={{ scale: 1.02, y: -2 }}
								whileTap={{ scale: 0.98 }}
								onClick={handleLogin}
								disabled={isLoading}
								className="w-full py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl transition-all disabled:opacity-70 relative overflow-hidden group"
							>
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
									animate={{ x: ["-200%", "200%"] }}
									transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
								/>
								{isLoading ? (
									<motion.div
										animate={{ rotate: 360 }}
										transition={{
											duration: 1,
											repeat: Infinity,
											ease: "linear",
										}}
										className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
									/>
								) : (
									<>
										<span className="relative z-10">Sign In to Dashboard</span>
										<motion.div
											animate={{ x: [0, 5, 0] }}
											transition={{ duration: 1.5, repeat: Infinity }}
											className="relative z-10"
										>
											<ArrowRight size={20} strokeWidth={2.5} />
										</motion.div>
									</>
								)}
							</motion.button>

							{/* Divider */}
							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
								</div>
								<div className="relative flex justify-center text-xs">
									<span className="px-4 bg-white text-gray-500 font-medium dark:bg-gray-900 dark:text-gray-400">
										Or
									</span>
								</div>
							</div>

							{/* Sign Up Link */}
							<div className="text-center">
								<p className="text-gray-700 font-medium text-sm dark:text-gray-300">
									Don&apos;t have an account?{" "}
									<motion.button
										onClick={() => router.push("/signup")}
										whileHover={{ x: 3 }}
										className="text-green-600 font-bold hover:text-green-700 transition-all inline-flex items-center gap-1 text-sm"
									>
										Create Account
										<ArrowRight size={14} />
									</motion.button>
								</p>
							</div>
						</div>
					</motion.div>

					{/* Security Badge */}
					<motion.div
						variants={itemVariants as Variants}
						whileHover={{ scale: 1.02 }}
						className="mt-5 bg-gradient-to-r from-green-50 via-emerald-50 to-blue-50 border border-green-200 rounded-2xl p-3 text-center dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 dark:border-green-800"
					>
						<div className="flex items-center justify-center gap-2">
							<Lock size={14} className="text-green-600" />
							<p className="text-gray-700 text-xs font-bold dark:text-gray-300">
								Bank-Grade Security | 256-bit Encryption
							</p>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
}
