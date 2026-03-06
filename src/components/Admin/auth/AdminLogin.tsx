// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { adminLogin } from "@/lib/admin-api";

export default function AdminLogin() {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const handleInputChange = (field: any, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = async (e: any) => {
		e.preventDefault();

		// Validation
		if (!formData.email || !formData.password) {
			toast.error("Please fill all fields");
			return;
		}

		if (!formData.email.includes("@")) {
			toast.error("Please enter a valid email");
			return;
		}

		setIsLoading(true);
		const loadingToast = toast.loading("Authenticating admin...");

		try {
			// Call the actual admin login API
			const response = await adminLogin(formData.email, formData.password);

			// Store the access token and user data
			localStorage.setItem("adminToken", response.data.accessToken);
			localStorage.setItem(
				"adminUser",
				JSON.stringify({
					...response.data.user,
					email: formData.email,
				}),
			);

			toast.success(response.message || "Login successful!", {
				id: loadingToast,
			});
			router.push("/admin/dashboard");
		} catch (error) {
			console.error("Admin login error:", error);
			toast.error(
				error.message || "Login failed. Please check your credentials.",
				{ id: loadingToast },
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full bg-[#f9fafb] dark:bg-gray-950 flex items-center justify-center p-4 relative">
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

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="relative w-full max-w-md"
			>
				{/* Admin Badge */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.2, type: "spring" }}
					className="flex justify-center mb-5"
				>
					<div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl shadow-2xl">
						<ShieldCheck className="w-10 h-10 text-white" />
					</div>
				</motion.div>

				{/* Login Card */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.3 }}
					className="bg-gray-50 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-200/80 dark:bg-gray-950 dark:border-gray-700/50 p-6"
				>
					{/* Header */}
					<div className="text-center mb-6">
						<h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1.5">Admin Portal</h1>
						<p className="text-gray-600 dark:text-gray-400 text-sm">Secure access to admin dashboard</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Email Field */}
						<div>
							<label
								htmlFor="email"
								className="block text-gray-800 dark:text-gray-300 font-bold mb-2 text-xs"
							>
								Admin Email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 dark:text-gray-400" />
								<input
									name="email"
									type="email"
									placeholder="admin@example.com"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									className="w-full pl-10 pr-3 py-3 text-sm bg-gray-50/50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500/50 focus:border-green-500 focus:outline-none rounded-xl transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
									disabled={isLoading}
								/>
							</div>
						</div>

						{/* Password Field */}
						<div>
							<label
								htmlFor="password"
								className="block text-gray-800 dark:text-gray-300 font-bold mb-2 text-xs"
							>
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 dark:text-gray-400" />
								<input
									name="password"
									type={showPassword ? "text" : "password"}
									placeholder="Enter your password"
									value={formData.password}
									onChange={(e) =>
										handleInputChange("password", e.target.value)
									}
									className="w-full pl-10 pr-12 py-3 text-sm bg-gray-50/50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500/50 focus:border-green-500 focus:outline-none rounded-xl transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
									disabled={isLoading}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-white transition-colors"
									disabled={isLoading}
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						{/* Submit Button */}
						<motion.button
							whileHover={{ scale: isLoading ? 1 : 1.02 }}
							whileTap={{ scale: isLoading ? 1 : 0.98 }}
							type="submit"
							disabled={isLoading}
							className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{isLoading ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									<span>Authenticating...</span>
								</div>
							) : (
								<div className="flex items-center justify-center gap-2">
									<ShieldCheck className="w-4 h-4" />
									<span>Admin Login</span>
								</div>
							)}
						</motion.button>
					</form>

					{/* Security Notice */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="mt-5 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl"
					>
						<p className="text-yellow-800 dark:text-yellow-400 text-xs text-center font-semibold">
							🔒 This is a secure admin area. All activities are logged.
						</p>
					</motion.div>
				</motion.div>

				{/* Footer */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6 }}
					className="text-center text-gray-600 dark:text-gray-500 text-xs mt-5"
				>
					Protected by enterprise-grade security
				</motion.p>
			</motion.div>
		</div>
	);
}
