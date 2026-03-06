"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Eye, EyeOff, X, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import brokerApi from "@/lib/broker-api";
import { ConnectBrokerDrawerProps } from "./types";

export default function ConnectBrokerDrawer({
	isOpen,
	onClose,
	selectedBroker,
	handleBrokerChange,
	setSelectedBroker,
	brokerDetails,
	handleInputChange,
	handleConnect,
	savedBrokerCredentials,
}: ConnectBrokerDrawerProps) {
	const [showApiSecret, setShowApiSecret] = useState(false);
	const [showMarketDataSecret, setShowMarketDataSecret] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
	const [clientId, setClientId] = useState<string | null>(null);

	useEffect(() => {
		if (savedBrokerCredentials) {
			if (selectedBroker && selectedBroker === savedBrokerCredentials.broker) {
				setClientId(savedBrokerCredentials.clientId || null);
			} else {
				setClientId(null);
			}
		} else {
			setClientId(null);
		}
		console.log(savedBrokerCredentials);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedBroker]);

	const handleBrokerChangeInternal = (broker: string) => {
		if (handleBrokerChange) {
			handleBrokerChange(broker);
		} else if (setSelectedBroker) {
			setSelectedBroker(broker);
		}
	};

	const handleRealConnect = async () => {
		// Check if user is authenticated
		const token = localStorage.getItem("accessToken");
		if (!token) {
			console.error("No authentication token found");
			toast.error("Please login first");
			return;
		}

		console.log("Broker connection attempt started:", {
			selectedBroker,
			hasToken: !!token,
			tokenLength: token.length,
			brokerDetails: {
				clientId: brokerDetails.clientId,
			},
		});

		// Validation - Only Client ID is required
		if (!selectedBroker) {
			console.log("Validation failed: No broker selected");
			toast.error("Please select a broker");
			return;
		}

		if (!brokerDetails.clientId || brokerDetails.clientId.trim() === "") {
			console.log("Validation failed: Client ID is required");
			toast.error("Please enter your Client ID");
			return;
		}

		console.log(
			"Validation passed - Client ID provided:",
			brokerDetails.clientId,
		);

		setIsConnecting(true);
		const loadingToast = toast.loading(
			"Saving credentials and connecting to broker...",
		);

		try {
			// Call parent's handleConnect which calls the backend API
			if (handleConnect) {
				await handleConnect();
				setConnectionStatus("success");
				toast.success("Broker connected successfully! 🎉", {
					id: loadingToast,
					duration: 5000,
				});
				
				// Close drawer after success
				setTimeout(() => {
					onClose();
					setConnectionStatus(null);
				}, 2000);
			} else {
				throw new Error("Connection handler not available");
			}
		} catch (error: any) {
			console.error("Broker connection error:", {
				error: error.message,
				stack: error.stack,
				selectedBroker,
				brokerDetails,
			});
			setConnectionStatus("error");
			toast.error(error.message || "Failed to connect broker", {
				id: loadingToast,
			});
		} finally {
			setIsConnecting(false);
		}
	};
	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
					/>

					{/* Drawer */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
					className="fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-2xl bg-gray-50 shadow-2xl z-50 overflow-y-auto dark:bg-gray-950"
					>
						<div className="p-4 sm:p-5">
							{/* Header */}
							<div className="flex items-center justify-between mb-4 sm:mb-5">
								<div className="flex items-center gap-2 sm:gap-3">
									<div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
										<Zap size={18} className="text-white sm:w-5 sm:h-5" />
									</div>
									<div>
										<h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
											Connect Broker
										</h2>
										<p className="text-xs text-gray-600 dark:text-gray-400">
											Link your trading account
										</p>
									</div>
								</div>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									onClick={onClose}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
								>
									<X size={20} className="text-gray-600 dark:text-gray-300" />
								</motion.button>
							</div>

							{/* Broker Selection */}
							<div className="mb-5">
								<label
									htmlFor="broker"
									className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
								>
									Select Broker
								</label>
								<select
									value={selectedBroker}
									onChange={(e) => handleBrokerChangeInternal(e.target.value)}
									className="w-full px-3 py-3 text-sm border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:outline-none rounded-xl transition-all bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100"
								>
									<option value="">Choose your broker</option>
									<option value="anandrathi">Anand Rathi</option>
									<option value="jainam">Jainam</option>
									<option value="upstox">Upstox</option>
								</select>
							</div>

							{/* Saved Credentials Info */}
							{savedBrokerCredentials && savedBrokerCredentials.isConnected && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl dark:bg-green-900/20 dark:border-green-700"
								>
									<div className="flex items-center gap-2 mb-2">
										<CheckCircle size={16} className="text-green-600" />
										<h3 className="text-green-800 font-bold text-sm dark:text-green-300">
											Saved Broker Credentials
										</h3>
									</div>
									<p className="text-green-700 text-xs dark:text-green-300">
										Broker:{" "}
										<span className="font-semibold">
											{savedBrokerCredentials.broker}
										</span>{" "}
										| Client ID:{" "}
										<span className="font-semibold">
											{savedBrokerCredentials.clientId}
										</span>{" "}
										| Connected:{" "}
										<span className="font-semibold">
											{savedBrokerCredentials.connectedAt
												? new Date(
														savedBrokerCredentials.connectedAt,
													).toLocaleDateString()
												: "N/A"}
										</span>
									</p>
								</motion.div>
							)}

							{/* Form Fields */}
							{selectedBroker && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="space-y-5"
								>
									{/* Client ID - Main Required Field */}
									<div>
										<label
											htmlFor="clientId"
											className="block text-gray-800 font-bold mb-2 text-xs dark:text-gray-200"
										>
											Client ID <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											placeholder="Enter your trading client ID (e.g., ABC123)"
											value={brokerDetails.clientId}
											onChange={(e) =>
												handleInputChange("clientId", e.target.value)
											}
											className="w-full px-3 py-3 text-sm border-2 border-green-300 hover:border-green-500 focus:border-green-600 focus:outline-none rounded-xl transition-all bg-green-50/30 hover:bg-white focus:bg-white font-medium text-gray-900 placeholder:text-gray-400 dark:border-green-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
											required
										/>
										<p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
											💡 This is your unique trading client ID provided by your
											broker
										</p>
									</div>

									{/* Success Info Box */}
									<div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700">
										<div className="flex items-start gap-2.5">
											<div className="flex-shrink-0 w-9 h-9 bg-green-500 rounded-full flex items-center justify-center">
												<CheckCircle size={16} className="text-white" />
											</div>
											<div>
												<h4 className="text-green-900 font-bold text-xs mb-1 dark:text-green-300">
													🎯 Simple & Secure Connection
												</h4>
												<p className="text-xs text-green-800 font-medium leading-relaxed dark:text-green-300">
													Only your <strong>Client ID</strong> is needed. All
													API credentials are securely managed by our system.
													Your trading account will be ready in seconds!
												</p>
											</div>
										</div>
									</div>

									{/* Connect Button */}
									<motion.button
										whileHover={{
											scale: isConnecting ? 1 : 1.02,
											y: isConnecting ? 0 : -2,
										}}
										whileTap={{ scale: isConnecting ? 1 : 0.98 }}
										onClick={handleRealConnect}
										disabled={isConnecting}
										className={`w-full py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group ${
											isConnecting ? "opacity-70 cursor-not-allowed" : ""
										}`}
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
										<span className="relative z-10 flex items-center justify-center gap-2">
											{isConnecting ? (
												<>
													<motion.div
														animate={{ rotate: 360 }}
														transition={{
															duration: 1,
															repeat: Infinity,
															ease: "linear",
														}}
														className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
													/>
													Connecting...
												</>
											) : (
												<>
													<Zap size={18} />
													Connect Broker
												</>
											)}
										</span>
									</motion.button>

									{/* Connection Status */}
									{connectionStatus && (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											className={`mt-3 p-3 rounded-xl flex items-center gap-2.5 ${
												connectionStatus === "success"
													? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700"
													: "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700"
											}`}
										>
											{connectionStatus === "success" ? (
												<CheckCircle size={16} className="text-green-600" />
											) : (
												<AlertCircle size={16} className="text-red-600" />
											)}
											<span
												className={`font-semibold text-sm ${
													connectionStatus === "success"
														? "text-green-800 dark:text-green-300"
														: "text-red-800 dark:text-red-300"
												}`}
											>
												{connectionStatus === "success"
													? "Broker successfully connected!"
													: "Failed to connect broker"}
											</span>
										</motion.div>
									)}

									{/* Security Note */}
									<div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-700">
										<p className="text-xs text-blue-800 font-medium dark:text-blue-300">
											🔒 <strong>100% Secure:</strong> Your Client ID is
											encrypted and stored safely. API credentials are managed
											at system level for maximum security.
										</p>
									</div>
								</motion.div>
							)}

							{!selectedBroker && (
								<div className="mt-6 text-center">
									<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 dark:bg-gray-800">
										<Zap size={28} className="text-gray-400 dark:text-gray-500" />
									</div>
									<p className="text-gray-600 font-medium text-sm dark:text-gray-300">
										Select a broker to get started
									</p>
								</div>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

