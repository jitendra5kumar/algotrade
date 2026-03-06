"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";
// All broker calls go through our backend API now
import { ConnectBrokerDrawer } from "@/components/panel/ConnectBroker";

// Type definitions
interface BrokerCredentials {
	isConnected: boolean;
	broker?: string;
	clientId?: string;
	connectedAt?: Date;
	balance?: unknown;
	message?: string;
}

interface BrokerDetails {
	clientId: string;
	apiKey: string;
	apiSecret: string;
	marketDataApiKey: string;
	marketDataSecret: string;
}

export default function ConnectBrokerPage() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedBroker, setSelectedBroker] = useState("");
	const [brokerDetails, setBrokerDetails] = useState<BrokerDetails>({
		clientId: "",
		apiKey: "",
		apiSecret: "",
		marketDataApiKey: "",
		marketDataSecret: "",
	});
	const [savedBrokerCredentials, setSavedBrokerCredentials] =
		useState<BrokerCredentials | null>(null);

	// Handle comma-separated URLs (take first one) - memoized to prevent re-renders
	const base = useMemo(() => {
		const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
		return envUrl.includes(',') ? envUrl.split(',')[0].trim() : envUrl.trim();
	}, []);

	// Use ref to track if status is already being loaded
	const isLoadingRef = useRef(false);

	useEffect(() => {
		// Prevent multiple simultaneous calls
		if (isLoadingRef.current) {
			return;
		}
		
		let isMounted = true;
		isLoadingRef.current = true;
		
		const loadBrokerCredentials = async () => {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				console.log(
					"No authentication token found, skipping broker status check",
				);
				isLoadingRef.current = false;
				return;
			}

        try {
            const statusRes = await fetch(`${base}/api/broker/status`, {
                headers:  { 'authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            
            if (!statusRes.ok) {
                throw new Error(`HTTP error! status: ${statusRes.status}`);
            }
            
            const contentType = statusRes.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Response is not JSON");
            }
            
            const status = await statusRes.json();
			
			// Only update state if component is still mounted
			if (!isMounted) return;
			
			console.log('Broker status response:', status);
			
			// Check if broker credentials exist (even if not fully connected)
			if (status.success && status.data) {
				const hasClientId = !!status.data.clientId;
				const isConnected = status.data.isConnected === true;
				const hasBroker = !!status.data.broker;
				
				console.log('Broker connection status:', {
					isConnected,
					hasClientId,
					hasBroker,
					broker: status.data.broker,
					clientId: status.data.clientId,
					connectedAt: status.data.connectedAt,
					fullData: status.data
				});
				
				// If we have clientId, show the saved credentials even if isConnected is false
				// This handles the case where credentials are saved but connection status might be stale
				if (hasClientId) {
					// Use broker from data, or try to infer from saved credentials
					const broker = status.data.broker || "";
					
					setSavedBrokerCredentials({
						...status.data,
						broker: broker,
						isConnected: isConnected || hasClientId, // Consider connected if we have clientId
					});
					setSelectedBroker(broker);
					setBrokerDetails({
						clientId: status.data.clientId || "", // User's actual client ID from database
						apiKey: "",
						apiSecret: "",
						marketDataApiKey: "",
						marketDataSecret: "",
					});
					console.log('Broker credentials loaded successfully (has clientId:', hasClientId, ', isConnected:', isConnected, ')');
				} else {
					console.log('No broker credentials found (no clientId)');
					setSavedBrokerCredentials(null);
				}
			} else {
				console.log('Status response indicates broker not connected:', status);
				setSavedBrokerCredentials(null);
			}
			} catch (error: unknown) {
				if (!isMounted) return;
				console.log(
					"No saved broker credentials found or authentication failed:",
					error instanceof Error ? error.message : String(error),
				);
				setSavedBrokerCredentials(null);
			} finally {
				isLoadingRef.current = false;
			}
		};

		loadBrokerCredentials();
		// Auto-open drawer when page loads
		setDrawerOpen(true);
		
		return () => {
			isMounted = false;
			isLoadingRef.current = false;
		};
	}, [base]);

	const handleInputChange = (field: string, value: string) => {
		setBrokerDetails((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleBrokerChange = (broker: string) => {
		setSelectedBroker(broker);
		let clientId = "";
		if (savedBrokerCredentials) {
			if (savedBrokerCredentials.broker === broker) {
				clientId = savedBrokerCredentials.clientId || ""; // User's actual client ID from database
			} else {
				clientId = "";
			}
		} else {
			clientId = "";
		}
		setBrokerDetails({
			clientId: clientId || "", // User's actual client ID from database
			apiKey: "",
			apiSecret: "",
			marketDataApiKey: "",
			marketDataSecret: "",
		});
	};

    const handleConnect = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                console.log("No auth token");
                return;
            }
            // Connect and save token on server

            const connectRes = await fetch(`${base}/api/broker/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    broker: selectedBroker,
                    clientId: brokerDetails.clientId
                })
            });
            
            if (!connectRes.ok) {
                throw new Error(`HTTP error! status: ${connectRes.status}`);
            }
            
            const contentType = connectRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                try {
                    const connectJson = await connectRes.clone().json();
                    console.log('broker-connect: response json =>', connectJson);
                } catch (e) {
                    console.log('broker-connect: failed to parse JSON response');
                }
            } else {
                console.log('broker-connect: non-json response received');
            }

            // Refresh status
            const statusRes = await fetch(`${base}/api/broker/status`, {
                headers: { 'authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            
            if (!statusRes.ok) {
                throw new Error(`HTTP error! status: ${statusRes.status}`);
            }
            
            const statusContentType = statusRes.headers.get("content-type");
            if (!statusContentType || !statusContentType.includes("application/json")) {
                throw new Error("Status response is not JSON");
            }
            
            const status = await statusRes.json();
            console.log('broker-status: response json =>', status);
            
            // Check if broker is connected after connect operation
            if (status.success && status.data) {
                const isConnected = status.data.isConnected === true;
                console.log('Broker connection status after connect:', {
                    isConnected,
                    broker: status.data.broker,
                    clientId: status.data.clientId,
                    fullData: status.data
                });
                
                if (isConnected) {
                    setSavedBrokerCredentials(status.data);
                    setSelectedBroker(status.data.broker || "");
                    setBrokerDetails({
                        clientId: status.data.clientId || "",
                        apiKey: "",
                        apiSecret: "",
                        marketDataApiKey: "",
                        marketDataSecret: "",
                    });
                    console.log('Broker credentials updated successfully after connect');
                } else {
                    console.log('Broker connection failed, status not connected');
                    setSavedBrokerCredentials(null);
                }
            } else {
                console.log('Status response indicates broker not connected after connect:', status);
                setSavedBrokerCredentials(null);
            }
        } catch (error: unknown) {
            console.log(
                "Connect broker failed:",
                error instanceof Error ? error.message : String(error),
            );
        }
    };

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="p-4 sm:p-6 lg:p-8"
			>
				<div className="mb-6 lg:mb-8">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 dark:text-gray-100">
						Connect Broker
					</h1>
					<p className="text-sm lg:text-base text-gray-600 font-medium dark:text-gray-300">
						Connect your trading account to start automated trading
					</p>
				</div>

				<div className="bg-white border-2 border-gray-200 rounded-2xl p-6 lg:p-8 shadow-lg dark:bg-gray-900 dark:border-gray-800">
					{savedBrokerCredentials ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
								<div>
									<h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
										Connected to {savedBrokerCredentials.broker}
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-300">
										Client ID: {savedBrokerCredentials.clientId}
									</p>
								</div>
								<div className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-full dark:bg-green-600">
									ACTIVE
								</div>
							</div>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => setDrawerOpen(true)}
								className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all dark:from-green-600 dark:to-emerald-700"
							>
								Update Connection
							</motion.button>
						</div>
					) : (
						<div className="text-center py-12">
							<h3 className="text-xl font-bold text-gray-900 mb-4 dark:text-gray-100">
								No Broker Connected
							</h3>
							<p className="text-gray-600 mb-6 dark:text-gray-300">
								Connect your broker account to start trading
							</p>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => setDrawerOpen(true)}
								className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all dark:from-green-600 dark:to-emerald-700"
							>
								Connect Broker
							</motion.button>
						</div>
					)}
				</div>
			</motion.div>

			<ConnectBrokerDrawer
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				selectedBroker={selectedBroker}
				handleBrokerChange={handleBrokerChange}
				setSelectedBroker={setSelectedBroker}
				brokerDetails={brokerDetails}
				handleInputChange={handleInputChange}
				handleConnect={handleConnect}
				savedBrokerCredentials={savedBrokerCredentials}
			/>
		</>
	);
}
