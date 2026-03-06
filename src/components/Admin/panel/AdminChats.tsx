"use client";

import { motion } from "framer-motion";
import {
	CheckCheck,
	Loader2,
	MessageCircle,
	Search,
	Send,
	User,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
	getAdminChat,
	getAllChats,
	markAdminMessagesRead,
	sendAdminMessage,
	updateChatStatus,
} from "@/lib/chat-api";
import { isSoundEnabled, playDoubleBeep, setSoundEnabled } from "@/utils/sound";

export default function AdminChats() {
	const [chats, setChats] = useState<any[]>([]);
	const [selectedChat, setSelectedChat] = useState<any>(null);
	const [messages, setMessages] = useState<any[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [soundEnabled, setSoundEnabledState] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const pollingInterval = useRef<NodeJS.Timeout | null>(null);
	const previousUnreadCount = useRef(0);

	// Scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Fetch all chats
	const fetchChats = async () => {
		try {
			const response = await getAllChats(filterStatus);
			if (response.success) {
				const newChats = response.data || [];

				// Calculate total unread messages from users
				const totalUnread = newChats.reduce(
					(sum, chat) => sum + (chat.unreadByAdmin || 0),
					0,
				);

				// Play sound if there are new unread messages
				if (
					previousUnreadCount.current > 0 &&
					totalUnread > previousUnreadCount.current &&
					soundEnabled &&
					isSoundEnabled()
				) {
					playDoubleBeep();
				}

				previousUnreadCount.current = totalUnread;
				setChats(newChats);
			}
		} catch (error) {
			console.error("Error fetching chats:", error);
		} finally {
			setLoading(false);
		}
	};

	// Fetch specific chat
	const fetchChatMessages = async (chatId) => {
		try {
			const response = await getAdminChat(chatId);
			if (response.success) {
				setMessages(response.data.messages || []);

				// Mark messages as read
				await markAdminMessagesRead(chatId);

				// Update local unread count
				setChats((prev: any) =>
					prev.map((chat) =>
						chat._id === chatId ? { ...chat, unreadByAdmin: 0 } : chat,
					),
				);
			}
		} catch (error) {
			console.error("Error fetching chat messages:", error);
		}
	};

	// Load sound preference
	useEffect(() => {
		setSoundEnabledState(isSoundEnabled());
	}, []);

	// Start polling
	useEffect(() => {
		fetchChats();

		// Poll every 3 seconds
		pollingInterval.current = setInterval(() => {
			fetchChats();
			if (selectedChat) {
				fetchChatMessages(selectedChat?._id);
			}
		}, 3000);

		return () => {
			if (pollingInterval.current) {
				clearInterval(pollingInterval.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterStatus, selectedChat, soundEnabled]);

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Select chat
	const handleSelectChat = async (chat) => {
		setSelectedChat(chat);
		await fetchChatMessages(chat._id);
	};

	// Send message
	const handleSendMessage = async (e) => {
		e.preventDefault();

		if (!newMessage.trim() || !selectedChat) return;

		setSending(true);
		try {
			const response = await sendAdminMessage(selectedChat._id, newMessage);
			if (response.success) {
				setMessages(response.data.messages || []);
				setNewMessage("");
				scrollToBottom();

				// Update chat list
				fetchChats();
			} else {
				toast.error(response.message || "Failed to send message");
			}
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error(error.message || "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	// Toggle chat status
	const handleToggleStatus = async (chatId, currentStatus) => {
		const newStatus = currentStatus === "open" ? "closed" : "open";
		try {
			const response = await updateChatStatus(chatId, newStatus);
			if (response.success) {
				toast.success(
					`Chat ${newStatus === "open" ? "opened" : "closed"} successfully`,
				);
				fetchChats();

				// Update selected chat if it's the same
				if (selectedChat && selectedChat._id === chatId) {
					setSelectedChat({ ...selectedChat, status: newStatus });
				}
			}
		} catch (error) {
			toast.error("Failed to update chat status");
		}
	};

	// Format timestamp
	const formatTime = (timestamp) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString("en-IN", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (timestamp) => {
		const date = new Date(timestamp);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		} else if (date.toDateString() === yesterday.toDateString()) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
			});
		}
	};

	// Filter chats
	const filteredChats = chats.filter(
		(chat) =>
			chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			chat.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
			chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Group messages by date
	const groupedMessages = messages.reduce((groups, message) => {
		const date = formatDate(message.timestamp);
		if (!groups[date]) {
			groups[date] = [];
		}
		groups[date].push(message);
		return groups;
	}, {});

	// Toggle sound
	const toggleSound = () => {
		const newState = !soundEnabled;
		setSoundEnabledState(newState);
		setSoundEnabled(newState);

		// Play test sound when enabling
		if (newState) {
			playDoubleBeep();
		}

		toast.success(newState ? "Sound enabled" : "Sound disabled", {
			icon: newState ? "🔊" : "🔇",
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-12 h-12 text-green-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Support Chats</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">Manage user conversations</p>
				</div>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={toggleSound}
					className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
						soundEnabled
							? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
							: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
					}`}
					title={soundEnabled ? "Mute notifications" : "Enable notifications"}
				>
					{soundEnabled ? (
						<>
							<Volume2 className="w-5 h-5" />
							<span className="hidden sm:inline">Sound On</span>
						</>
					) : (
						<>
							<VolumeX className="w-5 h-5" />
							<span className="hidden sm:inline">Sound Off</span>
						</>
					)}
				</motion.button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
				{/* Chat List */}
				<div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col">
					{/* Search and Filter */}
					<div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="text"
								placeholder="Search chats..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 focus:outline-none transition-all text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							/>
						</div>

						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 focus:outline-none transition-all text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						>
							<option value="all">All Chats</option>
							<option value="open">Open</option>
							<option value="closed">Closed</option>
						</select>
					</div>

					{/* Chats List */}
					<div className="flex-1 overflow-y-auto">
						{filteredChats.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center p-4">
								<MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
								<p className="text-gray-500 dark:text-gray-400">No chats found</p>
							</div>
						) : (
							filteredChats.map((chat) => (
								<motion.div
									key={chat._id}
									whileHover={{ scale: 1.01 }}
									onClick={() => handleSelectChat(chat)}
									className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
										selectedChat?._id === chat._id ? "bg-green-50 dark:bg-green-900/20" : "bg-white dark:bg-gray-900"
									}`}
								>
									<div className="flex items-start gap-3">
										<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
											<User className="w-5 h-5 text-white" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
													{chat.userName}
												</h3>
												{chat.unreadByAdmin > 0 && (
													<span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
														{chat.unreadByAdmin}
													</span>
												)}
											</div>
											<p className="text-sm text-gray-500 dark:text-gray-400 truncate">
												{chat.lastMessage || "No messages"}
											</p>
											<div className="flex items-center justify-between mt-1">
												<span className="text-xs text-gray-400 dark:text-gray-500">
													{formatDate(chat.lastMessageTime)}
												</span>
												<span
													className={`text-xs px-2 py-0.5 rounded-full ${
													chat.status === "open"
														? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
														: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
													}`}
												>
													{chat.status}
												</span>
											</div>
										</div>
									</div>
								</motion.div>
							))
						)}
					</div>
				</div>

				{/* Chat Window */}
				<div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col">
					{selectedChat ? (
						<>
							{/* Chat Header */}
							<div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
											<User className="w-5 h-5 text-white" />
										</div>
										<div>
											<h3 className="font-bold text-white">
												{selectedChat.userName}
											</h3>
											<p className="text-sm text-green-50">
												{selectedChat.userEmail}
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() =>
											handleToggleStatus(selectedChat._id, selectedChat.status)
										}
										className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
											selectedChat.status === "open"
												? "bg-white/20 hover:bg-white/30 text-white"
												: "bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
										}`}
									>
										{selectedChat.status === "open"
											? "Close Chat"
											: "Reopen Chat"}
									</button>
								</div>
							</div>

							{/* Messages */}
							<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
								{Object.entries(groupedMessages).map(([date, msgs]) => (
									<div key={date}>
										<div className="flex items-center justify-center my-4">
											<div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 font-medium">
												{date}
											</div>
										</div>

										{(msgs as any[]).map((message, index) => (
											<motion.div
												key={message?.id || index}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												className={`flex mb-3 ${
													message.sender === "admin"
														? "justify-end"
														: "justify-start"
												}`}
											>
												<div
													className={`max-w-[75%] rounded-2xl px-4 py-3 ${
														message.sender === "admin"
															? "bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-sm"
															: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm"
													}`}
												>
													<p className="text-sm break-words whitespace-pre-wrap">
														{message.message}
													</p>
													<div className="flex items-center gap-1 mt-1">
														<p
															className={`text-xs ${
																message.sender === "admin"
																	? "text-green-100"
																	: "text-gray-500 dark:text-gray-400"
															}`}
														>
															{formatTime(message.timestamp)}
														</p>
														{message.sender === "admin" && message.isRead && (
															<CheckCheck className="w-3 h-3 text-green-100" />
														)}
													</div>
												</div>
											</motion.div>
										))}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>

							{/* Input */}
							<div className="p-4 border-t border-gray-200 dark:border-gray-700">
								<form onSubmit={handleSendMessage} className="flex gap-2">
									<input
										type="text"
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										placeholder="Type your reply..."
										disabled={sending}
										className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 focus:outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
									/>
									<motion.button
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										type="submit"
										disabled={sending || !newMessage.trim()}
										className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
									>
										{sending ? (
											<Loader2 className="w-5 h-5 animate-spin" />
										) : (
											<Send className="w-5 h-5" />
										)}
									</motion.button>
								</form>
							</div>
						</>
					) : (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
								Select a chat
							</h3>
							<p className="text-gray-500 dark:text-gray-400">
								Choose a conversation from the list to start messaging
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
