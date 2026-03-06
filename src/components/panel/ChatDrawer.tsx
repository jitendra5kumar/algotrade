"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Loader2,
	MessageCircle,
	Send,
	Volume2,
	VolumeX,
	X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
	getUserChat,
	markUserMessagesRead,
	sendUserMessage,
} from "@/lib/chat-api";
import {
	isSoundEnabled,
	playNotificationSound,
	setSoundEnabled,
} from "@/utils/sound";

export default function ChatDrawer({ isOpen, onClose }) {
	const [messages, setMessages] = useState<any[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [chatId, setChatId] = useState<any>(null);
	const [soundEnabled, setSoundEnabledState] = useState(true);
	const messagesEndRef = useRef<any>(null);
	const pollingInterval = useRef<any>(null);
	const previousMessageCount = useRef<number>(0);

	// Scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Fetch chat
	const fetchChat = async () => {
		try {
			const response = await getUserChat();
			if (response.success) {
				setChatId(response.data._id);
				const newMessages = response.data.messages || [];

				// Check for new admin messages
				if (
					previousMessageCount.current > 0 &&
					newMessages.length > previousMessageCount.current
				) {
					const latestMessage = newMessages[newMessages.length - 1];
					if (
						latestMessage.sender === "admin" &&
						soundEnabled &&
						isSoundEnabled()
					) {
						playNotificationSound();
					}
				}

				previousMessageCount.current = newMessages.length;
				setMessages(newMessages);

				// Mark admin messages as read
				if (newMessages.some((m) => m.sender === "admin" && !m.isRead)) {
					await markUserMessagesRead();
				}
			}
		} catch (error) {
			console.error("Error fetching chat:", error);
		} finally {
			setLoading(false);
		}
	};

	// Load sound preference
	useEffect(() => {
		setSoundEnabledState(isSoundEnabled());
	}, []);

	// Start polling
	useEffect(() => {
		if (isOpen) {
			fetchChat();

			// Poll every 3 seconds
			pollingInterval.current = setInterval(() => {
				fetchChat();
			}, 3000);
		} else {
			// Reset message count when drawer closes
			previousMessageCount.current = 0;
		}

		return () => {
			if (pollingInterval.current) {
				clearInterval(pollingInterval.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, soundEnabled]);

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Send message
	const handleSendMessage = async (e) => {
		e.preventDefault();

		if (!newMessage.trim()) return;

		setSending(true);
		try {
			const response = await sendUserMessage(newMessage);
			if (response.success) {
				setMessages(response.data.messages || []);
				setNewMessage("");
				scrollToBottom();
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

	// Format timestamp with seconds
	const formatTime = (timestamp) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString("en-IN", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit", // Add seconds
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
			playNotificationSound();
		}

		toast.success(newState ? "Sound enabled" : "Sound disabled", {
			icon: newState ? "🔊" : "🔇",
		});
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
					className="fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-xl bg-white shadow-2xl z-50 flex flex-col dark:bg-gray-900"
					>
						{/* Header */}
						<div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
										<MessageCircle className="w-6 h-6 text-white" />
									</div>
									<div>
										<h2 className="text-xl sm:text-2xl font-bold text-white">
											Chat Support
										</h2>
										<p className="text-sm text-green-50">
											We&apos;re here to help you
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={toggleSound}
										className="p-2 hover:bg-white/20 rounded-xl transition-colors"
										title={
											soundEnabled
												? "Mute notifications"
												: "Enable notifications"
										}
									>
										{soundEnabled ? (
											<Volume2 className="w-5 h-5 text-white" />
										) : (
											<VolumeX className="w-5 h-5 text-white" />
										)}
									</motion.button>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={onClose}
										className="p-2 hover:bg-white/20 rounded-xl transition-colors"
									>
										<X className="w-6 h-6 text-white" />
									</motion.button>
								</div>
							</div>
						</div>

						{/* Messages Area */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
							{loading ? (
								<div className="flex items-center justify-center h-full">
									<Loader2 className="w-8 h-8 text-green-500 animate-spin" />
								</div>
							) : messages.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full text-center">
									<MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										No messages yet
									</h3>
									<p className="text-gray-500">
										Start a conversation with our support team
									</p>
								</div>
							) : (
								<>
									{Object.entries(groupedMessages).map(([date, msgs]) => (
										<div key={date}>
											{/* Date divider */}
											<div className="flex items-center justify-center my-4">
												<div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600 font-medium">
													{date}
												</div>
											</div>

											{/* Messages */}
											{(msgs as any[]).map((message) => (
												<motion.div
													key={message?._id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													className={`flex mb-3 ${
														message.sender === "user"
															? "justify-end"
															: "justify-start"
													}`}
												>
													<div
														className={`max-w-[75%] rounded-2xl px-4 py-3 ${
															message.sender === "user"
																? "bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-sm"
											: "bg-white border border-gray-200 text-gray-900 rounded-bl-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
														}`}
													>
														<p className="text-sm break-words whitespace-pre-wrap">
															{message.message}
														</p>
														<p
															className={`text-xs mt-1 ${
																message.sender === "user"
																	? "text-green-100"
																	: "text-gray-500"
															}`}
														>
															{formatTime(message.timestamp)}
														</p>
													</div>
												</motion.div>
											))}
										</div>
									))}
									<div ref={messagesEndRef} />
								</>
							)}
						</div>

						{/* Input Area */}
					<div className="p-4 border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
							<form onSubmit={handleSendMessage} className="flex gap-2">
								<input
									type="text"
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									placeholder="Type your message..."
									disabled={sending}
							className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
								/>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									type="submit"
									disabled={sending || !newMessage.trim()}
									className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{sending ? (
										<Loader2 className="w-5 h-5 animate-spin" />
									) : (
										<Send className="w-5 h-5" />
									)}
								</motion.button>
							</form>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
