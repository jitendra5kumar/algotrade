// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth-api";
import { getBrokerStatus } from "@/lib/broker-api";
import AlgoTrading from "../AlgoTrading";
import BrokerPanel from "../broker-panel/BrokerPanel";
import ChatDrawer from "../ChatDrawer";
import { ConnectBrokerDrawer } from "../ConnectBroker";
import { ContactDrawer } from "../Contact";
import MyAccount from "../MyAccount";
import TradeHistory from "../TradeHistory";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardContent from "./DashboardContent";
import type { BrokerDetails, ContactForm } from "./types";

const menuItems = [
	{ id: "dashboard", label: "Dashboard" },
	{ id: "connect-broker", label: "Connect Broker" },
	{ id: "algo-trading", label: "Algo Trading" },
	{ id: "broker-panel", label: "Broker Panel" },
	{ id: "trade-history", label: "Trade History" },
	{ id: "my-account", label: "My Account" },
	{ id: "contact", label: "Contact" },
];

export default function Dashboard() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeMenu, setActiveMenu] = useState("dashboard");
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
	const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
	const [selectedBroker, setSelectedBroker] = useState("");
	const [brokerDetails, setBrokerDetails] = useState<BrokerDetails>({
		clientId: "",
		apiKey: "",
		apiSecret: "",
		marketDataApiKey: "",
		marketDataSecret: "",
	});
	const [savedBrokerCredentials, setSavedBrokerCredentials] = useState(null);
	const [contactForm, setContactForm] = useState<ContactForm>({
		name: "",
		email: "",
		message: "",
	});
	const [userName, setUserName] = useState("User");
	const router = useRouter();

	// Load user data and broker credentials on component mount
	useEffect(() => {
		const user = getUser();
		if (user && user.name) {
			setUserName(user.name);
		}

		const loadBrokerCredentials = async () => {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				console.log(
					"No authentication token found, skipping broker status check",
				);
				return;
			}

			console.log("Loading broker credentials with token:", {
				hasToken: !!token,
				tokenLength: token.length,
			});

			try {
				const status = await getBrokerStatus();
				if (status.success && status.data.isConnected) {
					setSavedBrokerCredentials(status.data);
					setSelectedBroker(status.data.broker || "");
					setBrokerDetails({
						clientId: status.data.clientId || "",
						apiKey: "",
						apiSecret: "",
						marketDataApiKey: "",
						marketDataSecret: "",
					});
				}
			} catch (error) {
				console.log(
					"No saved broker credentials found or authentication failed:",
					error.message,
				);
			}
		};

		loadBrokerCredentials();
	}, []);

	const handleLogout = () => {
		router.push("/");
	};

	const handleConnect = () => {
		console.log("Connect broker clicked");
	};

	const handleInputChange = (field: string, value: string) => {
		setBrokerDetails((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleContactInputChange = (field: string, value: string) => {
		setContactForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleContactSubmit = () => {
		console.log("Contact form submitted:", contactForm);
		alert("Message sent successfully!");
		setContactDrawerOpen(false);
		setContactForm({ name: "", email: "", message: "" });
	};

	const currentMenuLabel =
		menuItems.find((m) => m.id === activeMenu)?.label || "Dashboard";

	return (
		<div className="flex h-screen bg-gray-50 overflow-hidden dark:bg-gray-950">
			{/* Sidebar */}
			<DashboardSidebar
				sidebarOpen={sidebarOpen}
				activeMenu={activeMenu}
				onMenuChange={setActiveMenu}
				onSidebarClose={() => setSidebarOpen(false)}
				onLogout={handleLogout}
				onConnectBroker={() => setDrawerOpen(true)}
				onContact={() => setChatDrawerOpen(true)}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden w-full">
				{/* Top Navigation */}
				<DashboardHeader
					userName={userName}
					onMenuClick={() => setSidebarOpen(true)}
				/>

				{/* Content Area */}
				<div className="flex-1 overflow-auto">
					{activeMenu === "algo-trading" && <AlgoTrading />}
					{activeMenu === "trade-history" && <TradeHistory />}
					{activeMenu === "broker-panel" && <BrokerPanel />}
					{activeMenu === "my-account" && <MyAccount />}
					{activeMenu !== "algo-trading" &&
						activeMenu !== "trade-history" &&
						activeMenu !== "broker-panel" &&
						activeMenu !== "my-account" && (
							<DashboardContent
								activeMenu={activeMenu}
								menuLabel={currentMenuLabel}
							/>
						)}
				</div>
			</div>

			{/* Connect Broker Drawer */}
			<ConnectBrokerDrawer
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				selectedBroker={selectedBroker}
				setSelectedBroker={setSelectedBroker}
				brokerDetails={brokerDetails}
				handleInputChange={handleInputChange}
				handleConnect={handleConnect}
				savedBrokerCredentials={savedBrokerCredentials}
			/>

			{/* Contact Drawer */}
			<ContactDrawer
				isOpen={contactDrawerOpen}
				onClose={() => setContactDrawerOpen(false)}
				contactForm={contactForm}
				handleContactInputChange={handleContactInputChange}
				handleContactSubmit={handleContactSubmit}
			/>

			{/* Chat Drawer */}
			<ChatDrawer
				isOpen={chatDrawerOpen}
				onClose={() => setChatDrawerOpen(false)}
			/>
		</div>
	);
}

