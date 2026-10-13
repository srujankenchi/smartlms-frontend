import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import chatApi from '../../api/chatApi';
import { getWebSocketUrl, getFileUrl, API_BASE_URL } from '../../api/config';
import toast from 'react-hot-toast';
import {
  FiSend,
  FiPaperclip,
  FiSmile,
  FiMoreVertical,
  FiSearch,
  FiX,
  FiDownload,
  FiCornerUpLeft,
  FiTrash2,
  FiMapPin,
  FiUsers,
  FiFileText,
  FiImage,
  FiCheck,
  FiChevronDown,
} from 'react-icons/fi';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🔥'];

export default function ClassConnect() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isTeacherOrAdmin = user?.role === 'ROLE_TEACHER' || user?.role === 'ROLE_ADMIN';

  // Chat Data State
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Input & Composer State
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group Metadata & Modals
  const [groupInfo, setGroupInfo] = useState({
    groupName: 'CSE Class Group',
    subtitle: '1 Teacher · Class Students',
    totalMembers: 0,
    members: [],
  });
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);

  // Real-Time & Scroll State
  const [wsConnected, setWsConnected] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ── 1. Initial Load: Messages, Group Info, Pinned ───────────
  useEffect(() => {
    fetchInitialData();
    // Mark room as read on open
    chatApi.markAsRead().catch(() => {});

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [msgRes, infoRes, pinnedRes] = await Promise.all([
        chatApi.getMessages(),
        chatApi.getGroupInfo().catch(() => null),
        chatApi.getPinnedMessages().catch(() => null),
      ]);

      setMessages(msgRes.data.data || []);
      if (infoRes?.data?.data) {
        setGroupInfo(infoRes.data.data);
      }
      if (pinnedRes?.data?.data) {
        setPinnedMessages(pinnedRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load chat data', err);
      setError('Could not connect to Class Connect. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── 2. Real-Time WebSocket Connection ───────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${getWebSocketUrl('/ws/chat')}?token=${encodeURIComponent(token)}`;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          console.log('Class Connect WebSocket connected.');
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            handleIncomingWsEvent(payload);
          } catch (e) {
            console.error('WS JSON parse error:', e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Try reconnecting after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.warn('WS error, fallback polling active', err);
          ws.close();
        };
      } catch (err) {
        console.warn('Could not initialize WebSocket', err);
      }
    };

    connectWebSocket();

    // Secondary fallback polling every 4 seconds to guarantee delivery
    const pollInterval = setInterval(async () => {
      try {
        const res = await chatApi.getMessages();
        const incoming = res.data.data || [];
        setMessages((prev) => {
          if (incoming.length !== prev.length) {
            return incoming;
          }
          return prev;
        });
      } catch (_) {}
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const handleIncomingWsEvent = (event) => {
    const { type, data } = event;
    if (!type) return;

    if (type === 'NEW_MESSAGE' && data) {
      setMessages((prev) => {
        // Prevent duplicate bubbles
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      // Mark read if user is currently looking at chat
      chatApi.markAsRead(data.id).catch(() => {});
      scrollToBottom();
    } else if (type === 'REACTION_UPDATED' && data) {
      setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    } else if (type === 'PIN_UPDATED' && data) {
      setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      // Refresh pinned list
      chatApi.getPinnedMessages().then((res) => setPinnedMessages(res.data.data || [])).catch(() => {});
    } else if (type === 'MESSAGE_DELETED' && data) {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      setPinnedMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    }
  };

  // ── 3. Auto Scroll Handling ─────────────────────────────────
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [loading]);

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  // ── 4. Sending Messages ─────────────────────────────────────
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (sending) return;

    const trimmed = inputText.trim();
    if (!trimmed && !selectedFile) {
      return;
    }

    setSending(true);
    try {
      if (selectedFile) {
        // Multipart send with file attachment
        const formData = new FormData();
        if (trimmed) formData.append('content', trimmed);
        if (replyingTo) formData.append('replyToId', replyingTo.id);
        formData.append('file', selectedFile);

        const res = await chatApi.sendMessageMultipart(formData, (progress) => {
          setUploadProgress(progress);
        });

        const newMsg = res.data.data;
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      } else {
        // Plain text message
        const payload = {
          content: trimmed,
          replyToId: replyingTo ? replyingTo.id : null,
        };
        const res = await chatApi.sendMessage(payload);
        const newMsg = res.data.data;
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      }

      // Reset composer
      setInputText('');
      setReplyingTo(null);
      setSelectedFile(null);
      setUploadProgress(null);
      setShowEmojiPicker(false);
      scrollToBottom();
    } catch (err) {
      console.error('Send failed', err);
      const msg = err.response?.data?.message || 'Failed to send message. Please retry.';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── 5. File Selection Handling ──────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit');
      e.target.value = null;
      return;
    }

    setSelectedFile(file);
    e.target.value = null;
  };

  // ── 6. Message Actions: Reply, React, Pin, Delete ───────────
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const res = await chatApi.toggleReaction(messageId, emoji);
      const updated = res.data.data;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      setActiveMessageMenu(null);
    } catch {
      toast.error('Could not react to message');
    }
  };

  const handleTogglePin = async (messageId) => {
    try {
      const res = await chatApi.togglePin(messageId);
      const updated = res.data.data;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      toast.success(updated.pinned || updated.isPinned ? 'Message pinned to group' : 'Message unpinned');
      // Refresh pinned list
      const pinRes = await chatApi.getPinnedMessages();
      setPinnedMessages(pinRes.data.data || []);
      setActiveMessageMenu(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Permission denied');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Message deleted');
      setActiveMessageMenu(null);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  // ── 7. Formatting Helpers ────────────────────────────────────
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Color generator for incoming sender names
  const getSenderColor = (role, senderId) => {
    if (role === 'ROLE_TEACHER') return '#176B52'; // Rich Dark Green
    if (role === 'ROLE_ADMIN') return '#6D28D9'; // Purple
    const colors = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED', '#DB2777'];
    return colors[(senderId || 0) % colors.length];
  };

  // Filtered messages for in-chat search
  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : messages;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top SmartLMS Global Navigation Header */}
      <Header
        icon="💬"
        portalBadge="Class Connect"
        badgeVariant="blue"
        tabs={[
          {
            id: 'dashboard',
            label: '← Back to Dashboard',
            active: false,
            onClick: () => {
              if (user?.role === 'ROLE_ADMIN') window.location.href = '/admin/dashboard';
              else if (user?.role === 'ROLE_TEACHER') window.location.href = '/teacher/dashboard';
              else window.location.href = '/student/dashboard';
            },
          },
          {
            id: 'class-connect',
            label: '💬 Class Connect (Live)',
            active: true,
            onClick: () => {},
          },
        ]}
      />

      {/* Main Centered WhatsApp-Style Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[82vh] min-h-[580px] max-h-[850px] relative">

          {/* ── A. WhatsApp-Style Dark Green Header ──────────────── */}
          <header className="bg-[#176B52] text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-sm shrink-0 z-20">
            {/* Left: Group Avatar & Title */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none group"
              onClick={() => setShowGroupModal(true)}
              title="Click to view Group Information & Members"
            >
              {/* Circular Group Avatar */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#135742] border-2 border-emerald-400/40 flex items-center justify-center text-white text-xl shadow-inner shrink-0 group-hover:scale-105 transition">
                🎓
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight truncate leading-tight">
                    {groupInfo.groupName || 'CSE Class Group'}
                  </h1>
                  {pinnedMessages.length > 0 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPinnedModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-700/80 hover:bg-emerald-600 px-2 py-0.5 rounded-full text-emerald-100 transition"
                      title="View pinned announcements"
                    >
                      <FiMapPin className="text-[10px]" /> {pinnedMessages.length} Pinned
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-100/90 truncate font-medium">
                  {groupInfo.subtitle || '1 Teacher · Class Students'}
                  {wsConnected && (
                    <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse" title="Connected" />
                  )}
                </p>
              </div>
            </div>

            {/* Right: Actions (Search & Three-dot Menu) */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-full hover:bg-white/10 text-emerald-50 transition ${
                  showSearch ? 'bg-white/20 text-white' : ''
                }`}
                title="Search conversation"
                aria-label="Search conversation"
              >
                <FiSearch className="text-lg" />
              </button>

              <button
                onClick={() => setShowGroupModal(true)}
                className="p-2 rounded-full hover:bg-white/10 text-emerald-50 transition"
                title="Class Members & Details"
                aria-label="Class Members & Details"
              >
                <FiUsers className="text-lg" />
              </button>

              <button
                onClick={() => setShowPinnedModal(true)}
                className="p-2 rounded-full hover:bg-white/10 text-emerald-50 transition"
                title="Pinned Teacher Announcements"
                aria-label="Pinned Announcements"
              >
                <FiMapPin className="text-lg" />
              </button>
            </div>
          </header>

          {/* Search Bar Overlay if Active */}
          {showSearch && (
            <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex items-center gap-2 z-10 shrink-0">
              <FiSearch className="text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search messages in CSE Class Group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-[#176B52]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <FiX />
              </button>
            </div>
          )}

          {/* ── B. WhatsApp-Style Warm Beige Chat Conversation ──── */}
          <div
            ref={chatScrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 relative"
            style={{
              backgroundColor: '#EFE9DF',
              backgroundImage: 'radial-gradient(#ded8cf 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Centered Date Separator */}
            <div className="flex justify-center my-2">
              <span className="bg-white/80 backdrop-blur-xs text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-md shadow-2xs border border-slate-200/60 uppercase tracking-wide">
                Today's Class Discussion
              </span>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <div className="w-8 h-8 border-3 border-[#176B52] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium">Loading classroom conversation...</p>
              </div>
            )}

            {/* Error Message with Retry */}
            {error && !loading && (
              <div className="max-w-md mx-auto my-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center shadow-xs">
                <p className="text-sm font-semibold">{error}</p>
                <button
                  onClick={fetchInitialData}
                  className="mt-3 px-4 py-1.5 bg-[#176B52] text-white text-xs font-semibold rounded-lg hover:bg-[#135742] transition"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && displayedMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <div className="w-16 h-16 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-3xl mb-3">
                  💬
                </div>
                <h3 className="font-bold text-slate-700 text-base">Welcome to Class Connect!</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Start the discussion with your classmates and faculty advisor. Share notes, questions, and learning resources.
                </p>
              </div>
            )}

            {/* Message Bubbles */}
            {!loading &&
              displayedMessages.map((msg, index) => {
                const isOutgoing = msg.senderId === currentUserId;
                const isTeacher = msg.senderRole === 'ROLE_TEACHER';
                const isAdmin = msg.senderRole === 'ROLE_ADMIN';
                const senderColor = getSenderColor(msg.senderRole, msg.senderId);

                // Hide sender name if consecutive from same person
                const prevMsg = displayedMessages[index - 1];
                const showSenderHeader = !isOutgoing && (!prevMsg || prevMsg.senderId !== msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group relative ${
                      isOutgoing ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] md:max-w-[62%] rounded-xl px-3 py-2 text-sm shadow-xs relative transition-all ${
                        isOutgoing
                          ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-none'
                          : 'bg-[#FFFFFF] text-slate-900 rounded-tl-none border border-slate-200/50'
                      }`}
                    >
                      {/* Pinned Badge on Message */}
                      {(msg.pinned || msg.isPinned) && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded mb-1 w-fit">
                          <FiMapPin className="text-[10px]" /> Pinned by {msg.pinnedByName || 'Faculty'}
                        </div>
                      )}

                      {/* Incoming Sender Name & Role Header */}
                      {showSenderHeader && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="font-bold text-xs"
                            style={{ color: senderColor }}
                          >
                            {msg.senderName}
                          </span>
                          {isTeacher && (
                            <span className="text-[10px] font-bold bg-[#176B52] text-white px-1.5 py-0.2 rounded">
                              Teacher
                            </span>
                          )}
                          {isAdmin && (
                            <span className="text-[10px] font-bold bg-purple-700 text-white px-1.5 py-0.2 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                      )}

                      {/* Replying-To Reference Box */}
                      {msg.replyTo && (
                        <div
                          className="bg-black/5 border-l-3 border-[#176B52] px-2.5 py-1.5 rounded text-xs mb-1.5 select-none cursor-pointer"
                          onClick={() => {
                            const el = document.getElementById(`msg-${msg.replyTo.id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        >
                          <div className="font-semibold text-[11px] text-[#176B52]">
                            {msg.replyTo.senderName}
                          </div>
                          <div className="text-[11px] text-slate-600 truncate">
                            {msg.replyTo.contentSnippet || 'Attachment'}
                          </div>
                        </div>
                      )}

                      {/* Attachment Rendering */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {msg.attachments.map((att) => {
                            const isImg = att.fileType && att.fileType.startsWith('image/');
                            return isImg ? (
                              <div key={att.id} className="rounded-lg overflow-hidden border border-slate-200">
                                <a
                                  href={getFileUrl(att.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={getFileUrl(att.fileUrl)}
                                    alt={att.fileName}
                                    className="max-h-64 w-full object-cover rounded-lg hover:opacity-95 transition"
                                  />
                                </a>
                              </div>
                            ) : (
                              <div
                                key={att.id}
                                className="flex items-center justify-between gap-3 p-2.5 bg-black/5 rounded-lg border border-black/10"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="p-2 bg-white rounded-md text-slate-700 text-lg shadow-2xs">
                                    <FiFileText />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-900 truncate">
                                      {att.fileName}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {formatFileSize(att.fileSize)}
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={`${API_BASE_URL}/chat/attachments/${att.id}/download`}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 transition shrink-0"
                                  title="Download File"
                                  download
                                >
                                  <FiDownload className="text-sm" />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Message Text Content */}
                      <div className="whitespace-pre-wrap break-words leading-relaxed text-[13px] sm:text-sm">
                        {msg.content}
                      </div>

                      {/* Timestamp & Status Checkmarks */}
                      <div className="flex items-center justify-end gap-1 mt-1 select-none text-[10px] text-slate-400">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isOutgoing && (
                          <span className="text-[#176B52] font-bold text-xs" title="Delivered">
                            ✓✓
                          </span>
                        )}
                      </div>

                      {/* Emoji Reactions Bar */}
                      {msg.reactionCounts && Object.keys(msg.reactionCounts).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-black/5">
                          {Object.entries(msg.reactionCounts).map(([emoji, count]) => {
                            const userHasReacted = msg.myReactions?.includes(emoji);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                                  userHasReacted
                                    ? 'bg-emerald-100/80 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'
                                }`}
                                title={`${msg.reactions?.[emoji]?.join(', ') || ''}`}
                              >
                                <span>{emoji}</span>
                                <span>{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Message Hover Action Trigger Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id);
                        }}
                        className={`absolute top-1.5 right-1.5 p-1 rounded hover:bg-black/10 text-slate-400 hover:text-slate-700 transition opacity-0 group-hover:opacity-100 ${
                          activeMessageMenu === msg.id ? 'opacity-100' : ''
                        }`}
                        title="Message actions"
                      >
                        <FiMoreVertical className="text-xs" />
                      </button>

                      {/* Floating Message Menu Popover */}
                      {activeMessageMenu === msg.id && (
                        <div
                          className="absolute right-0 top-7 z-30 bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[170px] space-y-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Quick Emoji Reaction Row */}
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 px-1">
                            {QUICK_EMOJIS.slice(0, 5).map((em) => (
                              <button
                                key={em}
                                onClick={() => handleToggleReaction(msg.id, em)}
                                className="hover:scale-125 transition text-sm p-0.5"
                              >
                                {em}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setReplyingTo(msg);
                              setActiveMessageMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition"
                          >
                            <FiCornerUpLeft /> Reply
                          </button>

                          {isTeacherOrAdmin && (
                            <button
                              onClick={() => handleTogglePin(msg.id)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition"
                            >
                              <FiMapPin /> {(msg.pinned || msg.isPinned) ? 'Unpin Message' : 'Pin Announcement'}
                            </button>
                          )}

                          {(isOutgoing || isTeacherOrAdmin) && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-20 right-6 bg-[#176B52] text-white p-2.5 rounded-full shadow-lg hover:bg-[#135742] transition z-20 flex items-center justify-center animate-bounce"
              title="Scroll to bottom"
            >
              <FiChevronDown className="text-lg" />
            </button>
          )}

          {/* ── C. WhatsApp-Style Bottom Message Composer ────────── */}
          <footer className="bg-slate-100/95 border-t border-slate-300 p-2.5 sm:p-3 relative shrink-0 z-20">
            {/* Active Replying-To Banner */}
            {replyingTo && (
              <div className="bg-white border-l-4 border-[#176B52] rounded-lg p-2 mb-2 flex items-center justify-between text-xs shadow-xs">
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-[#176B52]">
                    Replying to {replyingTo.senderName}:
                  </span>{' '}
                  <span className="text-slate-600 truncate inline-block max-w-xs align-bottom">
                    {replyingTo.content}
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <FiX />
                </button>
              </div>
            )}

            {/* Selected Attachment Preview Banner */}
            {selectedFile && (
              <div className="bg-white rounded-lg p-2 mb-2 flex items-center justify-between text-xs shadow-xs border border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base text-[#176B52]">📎</span>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 truncate block max-w-xs">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                </div>
                {uploadProgress !== null && (
                  <span className="text-xs font-bold text-emerald-700">
                    {uploadProgress}%
                  </span>
                )}
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <FiX />
                </button>
              </div>
            )}

            {/* Emoji Quick Bar Popover */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 flex items-center gap-2 z-30">
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      setInputText((prev) => prev + em);
                      setShowEmojiPicker(false);
                    }}
                    className="text-lg hover:scale-125 transition p-1"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.docx,.doc,.xlsx,.pptx,.zip"
            />

            {/* Composer Input & Send Button */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Paperclip Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full text-slate-500 hover:text-[#176B52] hover:bg-slate-200/80 transition shrink-0"
                title="Attach learning materials (PDF, images, documents)"
                aria-label="Attach File"
              >
                <FiPaperclip className="text-lg" />
              </button>

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-full text-slate-500 hover:text-amber-600 hover:bg-slate-200/80 transition shrink-0"
                title="Insert emoji"
                aria-label="Emoji Picker"
              >
                <FiSmile className="text-lg" />
              </button>

              {/* Text Input (Rounded) */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message your class..."
                  disabled={sending}
                  className="w-full bg-white text-slate-800 placeholder-slate-400 text-sm rounded-full px-4 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B52] shadow-2xs"
                />
              </div>

              {/* Circular Green Send Button */}
              <button
                type="submit"
                disabled={sending || (!inputText.trim() && !selectedFile)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#176B52] hover:bg-[#135742] text-white flex items-center justify-center transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title="Send message"
                aria-label="Send Message"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend className="text-base sm:text-lg translate-x-[-1px] translate-y-[1px]" />
                )}
              </button>
            </form>
          </footer>
        </div>
      </main>

      {/* ── D. Group Information & Members Modal ──────────────── */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="bg-[#176B52] text-white p-6 text-center relative">
              <button
                onClick={() => setShowGroupModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white transition"
              >
                <FiX />
              </button>
              <div className="w-16 h-16 rounded-full bg-[#135742] border-3 border-emerald-400/50 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                🎓
              </div>
              <h2 className="text-xl font-bold">{groupInfo.groupName}</h2>
              <p className="text-xs text-emerald-100 mt-1">
                Faculty Advisor: {groupInfo.teacherName} ({groupInfo.teacherEmail})
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Class Members ({groupInfo.members?.length || 0})
                </h3>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {groupInfo.members?.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-400">{m.email}</div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          m.role === 'ROLE_TEACHER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.role === 'ROLE_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.role === 'ROLE_TEACHER' ? 'Teacher' : m.role === 'ROLE_ADMIN' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── E. Pinned Announcements Modal ─────────────────────── */}
      {showPinnedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="bg-[#176B52] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <FiMapPin /> Pinned Teacher Announcements ({pinnedMessages.length})
              </div>
              <button
                onClick={() => setShowPinnedModal(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <FiX />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {pinnedMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No messages have been pinned yet. Teachers can pin key course announcements.
                </div>
              ) : (
                pinnedMessages.map((pin) => (
                  <div
                    key={pin.id}
                    className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-950">
                        {pin.senderName} ({pin.senderRole === 'ROLE_TEACHER' ? 'Teacher' : 'Faculty'})
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        {formatTime(pin.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap">{pin.content}</p>
                    {isTeacherOrAdmin && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleTogglePin(pin.id)}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          Unpin Announcement
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
