import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthProvider";
import { BASE_URL, getAllUsers, getConversation } from "../utils/api";
import { useSocket } from "../context/SocketProvider";

interface User {
  _id: string;
  username: string;
  // Add other user properties as needed
}

interface Message {
  _id: string;
  message: string;
  senderId: string;
  createdAt: string;
  // Add other message properties as needed
}

const Home = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [status, setStatus] = useState("Online");

  // Join socket room on mount

  useEffect(() => {
    socket.on("set-online", (data: any) => {
      if (data) setStatus("online");
      else setStatus("offiline");
    });
  }, [socket, user]);
  useEffect(() => {
    if (user?.data) {
      socket.emit("join", user.data);
    }
  }, [socket, user]);

  useEffect(() => {
    const handleReceiveMessage = (data: Message) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive-message", handleReceiveMessage);
    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [socket]);

  const scrollToBottom = (smooth: boolean = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await getAllUsers();
      setAllUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (convoId: string) => {
    if (!convoId) return;

    setLoadingMessages(true);
    try {
      const { data } = await getConversation(convoId);
      setMessages(data?.messages || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    try {
      setLoadingMessages(true);
      const res = await fetch(`${BASE_URL}/conversation/create-conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recepientIds: [user._id] }),
        credentials: "include",
      });
      const result = await res.json();
      setConversationId(result.data._id);
      socket.emit("join-room", result.data._id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !selectedUser ||
      !conversationId ||
      sendingMessage
    )
      return;

    setSendingMessage(true);
    try {
      const res = await fetch(
        `${BASE_URL}/message/send-message/${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage }),
          credentials: "include",
        }
      );
      const { data } = await res.json();
      socket.emit("send-message", data);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !sendingMessage) {
      handleSendMessage();
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  // Scroll behavior
  useEffect(() => {
    if (isInitialLoad) {
      scrollToBottom(false);
      setIsInitialLoad(false);
    } else {
      scrollToBottom(true);
    }
  }, [messages]);

  useEffect(() => {
    socket.on("receive-indicator", (indicator: string) => {
      console.log(indicator);
      setStatus(indicator);
    });
  }, [socket]);

  // Reset initial load when conversation changes
  useEffect(() => {
    setIsInitialLoad(true);
  }, [conversationId]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        allUsers={allUsers}
        selectedUser={selectedUser}
        handleUserSelect={handleUserSelect}
        currentUser={user?.data}
        loading={loadingUsers}
      />
      <ChatArea
        status={status}
        conversationId={conversationId}
        selectedUser={selectedUser}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
        messagesEndRef={messagesEndRef}
        loading={loadingMessages}
        sending={sendingMessage}
      />
    </div>
  );
};

interface SidebarProps {
  allUsers: User[];
  selectedUser: User | null;
  handleUserSelect: (user: User) => void;
  currentUser?: User;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  allUsers,
  selectedUser,
  handleUserSelect,
  currentUser,
  loading,
}) => (
  <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
    </div>
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {allUsers.map((u) => (
            <li
              key={u._id}
              onClick={() => handleUserSelect(u)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedUser?._id === u._id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {u.username?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {u.username}
                  </p>
                  <p className="text-xs text-gray-500">Last seen today</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    <div className="p-4 border-t border-gray-200">
      {currentUser && (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
            {currentUser.username?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {currentUser.username}
            </p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      )}
    </div>
  </aside>
);

interface ChatAreaProps {
  selectedUser: User | null;
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  messagesEndRef?: any;
  loading: boolean;
  sending: boolean;
  conversationId?: string;
  status?: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedUser,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyPress,
  messagesEndRef,
  loading,
  sending,
  conversationId,
  status,
}) => {
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  let typingTimeout: any;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typingTimeout) clearTimeout(typingTimeout);

    if (e.target.value && conversationId) {
      if (!isTyping) {
        socket.emit("send-indicator", {
          indicator: "typing...",
          roomId: conversationId,
        });
        setIsTyping(true);
      }

      typingTimeout = setTimeout(() => {
        socket.emit("send-indicator", {
          indicator: "",
          roomId: conversationId,
        });
        setIsTyping(false);
      }, 4000);
    } else if (isTyping) {
      socket.emit("send-indicator", {
        indicator: "",
        roomId: conversationId,
      });
      setIsTyping(false);
    }
  };

  const isMyMessage = (senderId: string) => {
    const { user } = useAuth();
    const myId = user.data?._id;
    return senderId === myId;
  };

  return (
    <main className="flex-1 flex flex-col">
      {selectedUser ? (
        <>
          <div className="p-4 border-b border-gray-200 bg-white flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {selectedUser.username?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="font-medium">{selectedUser.username}</p>
              <p className="text-xs text-gray-500">{status}</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      ref={
                        index === messages.length - 1 ? messagesEndRef : null
                      }
                      className={`flex ${
                        isMyMessage(msg.senderId)
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                          isMyMessage(msg.senderId)
                            ? "bg-blue-500 text-white rounded-tr-none"
                            : "bg-white text-gray-800 rounded-tl-none"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs mt-1 text-right text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
                onInput={handleInput}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className={`ml-2 ${
                  sending || !newMessage.trim()
                    ? "bg-blue-300"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white rounded-full p-2 transition-colors`}
              >
                {sending ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center p-6 max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No chat selected
            </h3>
            <p className="mt-1 text-gray-500">
              Select a conversation from the sidebar to start chatting
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
