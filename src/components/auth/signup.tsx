"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	Lock,
	Mail,
	Phone,
	TrendingUp,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { authAPI, saveAuthData } from "@/lib/auth-api";

export default function SignUpPage() {
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		mobile: "",
		password: "",
		confirmPassword: "",
		otp: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const router = useRouter();

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleNext = async () => {
		if (!validateStep()) {
			return;
		}

		// If on step 2 (contact + password), request OTP
		if (currentStep === 2 && !otpSent) {
			await handleRequestOTP();
			return;
		}

		// If on step 3 (OTP), verify and complete registration
		if (currentStep === 3) {
			await handleSubmit();
			return;
		}

		// Otherwise move to next step
		if (currentStep < 3) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrev = () => {
		if (currentStep > 1) {
			if (currentStep === 3 && otpSent) {
				// If going back from OTP step, reset OTP sent state
				setOtpSent(false);
			}
			setCurrentStep(currentStep - 1);
		}
	};

	const validateStep = () => {
		if (currentStep === 1) {
			if (!formData.firstName.trim()) {
				toast.error("Please enter your first name");
				return false;
			}
			if (!formData.lastName.trim()) {
				toast.error("Please enter your last name");
				return false;
			}
			return true;
		}

		if (currentStep === 2) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email)) {
				toast.error("Please enter a valid email address");
				return false;
			}
			if (formData.mobile && formData.mobile.length < 10) {
				toast.error("Please enter a valid mobile number");
				return false;
			}
			if (formData.password.length < 8) {
				toast.error("Password must be at least 8 characters");
				return false;
			}
			if (formData.password !== formData.confirmPassword) {
				toast.error("Passwords do not match");
				return false;
			}
			return true;
		}

		if (currentStep === 3) {
			if (formData.otp.length !== 6) {
				toast.error("Please enter the 6-digit OTP");
				return false;
			}
			return true;
		}

		return false;
	};

	const handleRequestOTP = async () => {
		setIsLoading(true);
		const loadingToast = toast.loading("Sending OTP...");

		try {
			const userData = {
				name: `${formData.firstName} ${formData.lastName}`,
				email: formData.email,
				password: formData.password,
				phone: formData.mobile || undefined,
			};

			const response = await authAPI.requestRegistrationOTP(userData);

			toast.success("OTP sent to your email! Check your inbox.", {
				id: loadingToast,
				duration: 5000,
			});

			console.log("🔐 Dummy OTP: 353535");
			setOtpSent(true);
			setCurrentStep(3); // Move to OTP step
		} catch (error) {
			toast.error(error.message || "Failed to send OTP", {
				id: loadingToast,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOTP = async () => {
		setIsLoading(true);
		const loadingToast = toast.loading("Resending OTP...");

		try {
			await authAPI.resendOTP(formData.email, "REGISTRATION");
			toast.success("OTP resent successfully!", {
				id: loadingToast,
			});
			console.log("🔐 Dummy OTP: 353535");
		} catch (error) {
			toast.error(error.message || "Failed to resend OTP", {
				id: loadingToast,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async () => {
		setIsLoading(true);
		const loadingToast = toast.loading("Creating your account...");

		try {
			const response = await authAPI.verifyRegistrationOTP(
				formData.email,
				formData.otp,
			);

			// Save auth data
			saveAuthData(response.data.accessToken, response.data.user);

			toast.success("Account created successfully! Welcome to AlgoTrade! 🎉", {
				id: loadingToast,
				duration: 5000,
			});

			// Redirect to dashboard after a brief delay
			setTimeout(() => {
				router.push("/dashboard");
			}, 1500);
		} catch (error) {
			toast.error(error.message || "Failed to create account", {
				id: loadingToast,
			});
			setIsLoading(false);
		}
	};

	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
		exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
	};

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<motion.div
						key="step1"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="space-y-4"
					>
						<div>
							<label
								htmlFor="firstName"
                                className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
							>
								First Name
							</label>
							<div className="relative">
								<User
									size={18}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600"
								/>
								<input
									type="text"
									placeholder="Enter your first name"
									value={formData.firstName}
									onChange={(e) =>
										handleInputChange("firstName", e.target.value)
									}
                                    className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="lastName"
                                className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
							>
								Last Name
							</label>
							<div className="relative">
								<User
									size={18}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600"
								/>
								<input
									type="text"
									placeholder="Enter your last name"
									value={formData.lastName}
									onChange={(e) =>
										handleInputChange("lastName", e.target.value)
									}
                                    className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
								/>
							</div>
						</div>
					</motion.div>
				);

			case 2:
				return (
					<motion.div
						key="step2"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="space-y-4"
					>
						<div>
							<label
								htmlFor="email"
								className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
							>
								Email Address
							</label>
							<div className="relative">
								<Mail
									size={18}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600"
								/>
								<input
									type="email"
									placeholder="Enter your email"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="mobile"
								className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
							>
								Mobile Number (Optional)
							</label>
							<div className="relative">
								<Phone
									size={18}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600"
								/>
								<input
									type="tel"
									placeholder="Enter your mobile number"
									value={formData.mobile}
									onChange={(e) =>
										handleInputChange(
											"mobile",
											e.target.value.replace(/\D/g, ""),
										)
									}
									maxLength={10}
									className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
							>
								Password
							</label>
							<div className="relative">
								<Lock
									size={18}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600"
								/>
								<input
									type="password"
									placeholder="Enter your password"
									value={formData.password}
									onChange={(e) =>
										handleInputChange("password", e.target.value)
									}
									className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
							>
								Confirm Password
							</label>
							<div className="relative">
								<Lock
									size={18}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600"
								/>
								<input
									type="password"
									placeholder="Confirm your password"
									value={formData.confirmPassword}
									onChange={(e) =>
										handleInputChange("confirmPassword", e.target.value)
									}
									className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
								/>
							</div>
						</div>

						{formData.password &&
							formData.confirmPassword &&
							formData.password !== formData.confirmPassword && (
								<p className="text-red-500 text-xs font-semibold">
									Passwords don&apos;t match
								</p>
							)}
					</motion.div>
				);

			case 3:
				return (
					<motion.div
						key="step3"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="space-y-4"
					>
						<p className="text-gray-600 text-sm font-medium text-center">
							We&apos;ve sent a 6-digit OTP to{" "}
							<span className="font-bold text-green-600">{formData.email}</span>
						</p>

						<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
							<p className="text-xs text-blue-800 font-semibold">
								🔐 Dummy OTP: <span className="text-lg font-mono">353535</span>
							</p>
						</div>

						<div>
							<label
								htmlFor="otp"
								className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
							>
								Enter OTP
							</label>
							<input
								type="text"
								placeholder="000000"
								maxLength={6}
								value={formData.otp}
								onChange={(e) =>
									handleInputChange("otp", e.target.value.replace(/\D/g, ""))
								}
								className="w-full px-4 py-3 text-lg border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-bold text-center tracking-widest text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100"
							/>
						</div>

						<button
							type="button"
							onClick={handleResendOTP}
							disabled={isLoading}
							className="text-green-600 font-bold hover:text-green-700 transition-colors disabled:opacity-50"
						>
							Resend OTP
						</button>
					</motion.div>
				);

			default:
				return null;
		}
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
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="w-full max-w-md"
				>
					{/* Logo & Brand */}
					<div className="text-center mb-6">
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
							Create your trading account
						</p>
					</div>

					{/* Progress Bar */}
					<div className="flex gap-1 mb-6">
						{[1, 2, 3].map((step) => (
							<motion.div
								key={step}
								animate={{
									backgroundColor: step <= currentStep ? "#10b981" : "#e5e7eb",
								}}
								className="h-1 flex-1 rounded-full transition-all"
							/>
						))}
					</div>

					{/* Card */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="relative group"
					>
						{/* Enhanced Glow Effect */}
						<div className="absolute -inset-2 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-blue-500/30 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

						<div className="relative bg-gray-50 backdrop-blur-2xl border-2 border-gray-200/80 hover:border-green-300 rounded-3xl p-6 shadow-2xl transition-all duration-300 dark:bg-gray-950 dark:border-gray-700 dark:hover:border-green-700">
							{/* Step Indicator */}
							<div className="mb-4">
								<h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
									{currentStep === 1 && "Basic Info"}
									{currentStep === 2 && "Contact & Password"}
									{currentStep === 3 && "Verify OTP"}
								</h2>
								<p className="text-xs text-gray-600 font-medium dark:text-gray-400">
									Step {currentStep} of 3
								</p>
							</div>

							{/* Form Content */}
							<div className="mb-6 min-h-[240px]">
								<AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
							</div>

							{/* Buttons */}
							<div className="flex gap-4">
								<motion.button
									whileHover={{ scale: 1.02, y: -2 }}
									whileTap={{ scale: 0.98 }}
									onClick={handlePrev}
									disabled={currentStep === 1}
									className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-40 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
								>
									<ArrowLeft size={16} className="text-gray-700 dark:text-gray-300" />
									Back
								</motion.button>

								<motion.button
									whileHover={{ scale: 1.02, y: -2 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleNext}
									disabled={isLoading}
									className="flex-1 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl transition-all disabled:opacity-70 relative overflow-hidden group"
								>
									<motion.div
										className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
										animate={{ x: ["-200%", "200%"] }}
										transition={{
											duration: 3,
											repeat: Infinity,
											ease: "linear",
										}}
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
									) : currentStep === 3 ? (
										<>
											<CheckCircle size={18} className="relative z-10" />
											<span className="relative z-10">Create Account</span>
										</>
									) : currentStep === 2 && !otpSent ? (
										<>
											<span className="relative z-10">Send OTP</span>
											<ArrowRight size={18} className="relative z-10" />
										</>
									) : (
										<>
											<span className="relative z-10">Next</span>
											<ArrowRight size={18} className="relative z-10" />
										</>
									)}
								</motion.button>
							</div>

							{/* Divider */}
							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
								</div>
								<div className="relative flex justify-center text-xs">
									<span className="px-4 bg-gray-50 text-gray-500 font-medium dark:bg-gray-950 dark:text-gray-400">
										Or
									</span>
								</div>
							</div>

							{/* Login Link */}
							<div className="text-center">
								<p className="text-gray-700 font-medium text-sm dark:text-gray-300">
									Already have an account?{" "}
									<motion.button
										onClick={() => router.push("/login")}
										whileHover={{ x: 3 }}
										className="text-green-600 font-bold hover:text-green-700 transition-all inline-flex items-center gap-1 text-sm"
									>
										Login
										<ArrowRight size={14} />
									</motion.button>
								</p>
							</div>
						</div>
					</motion.div>

					{/* Security Badge */}
					<motion.div
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
