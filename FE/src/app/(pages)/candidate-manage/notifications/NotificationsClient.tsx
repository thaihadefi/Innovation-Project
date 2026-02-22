"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBell, FaCheckCircle, FaBriefcase, FaEye, FaTimesCircle } from "react-icons/fa";
import { Toaster, toast } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useListQueryState } from "@/hooks/useListQueryState";

// Get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "application_received":
      return <FaBriefcase className="text-[#0088FF]" />;
    case "application_approved":
    case "cv_approved":
      return <FaCheckCircle className="text-[#22C55E]" />;
    case "cv_viewed":
      return <FaEye className="text-[#F59E0B]" />;
    case "cv_rejected":
      return <FaTimesCircle className="text-[#EF4444]" />;
    default:
      return <FaBell className="text-[#0088FF]" />;
  }
};

interface NotificationsClientProps {
  initialNotifications: any[];
  initialPagination?: {
    totalRecord: number;
    totalPage: number;
    currentPage: number;
    pageSize: number;
  } | null;
  initialUnreadCount?: number;
}

export const NotificationsClient = ({ initialNotifications, initialPagination = null, initialUnreadCount = 0 }: NotificationsClientProps) => {
  const { queryKey, getPage, replaceQuery } = useListQueryState();

  const [notifications, setNotifications] = useState<any[]>(initialNotifications);
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isFirstLoad = useRef(true);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const fetchNotifications = useCallback(async (page: number, silent = false) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    if (!silent) {
      setLoading(true);
      setErrorMessage("");
    }
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/notifications?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.code === "success") {
        setNotifications(data.notifications || []);
        setPagination(data.pagination || null);
        setUnreadCount(data.unreadCount || 0);
        channelRef.current?.postMessage({ type: "notification_count_update", role: "candidate", unreadCount: data.unreadCount || 0 });
      } else if (!silent) {
        setErrorMessage("Unable to load notifications. Please try again.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError" && !silent) {
        console.error("Failed to fetch candidate notifications:", error);
        setErrorMessage("Unable to load notifications. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted && !silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const pageFromUrl = getPage();
    setCurrentPage((prev) => (prev === pageFromUrl ? prev : pageFromUrl));
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchNotifications(pageFromUrl, true);
      return;
    }
    fetchNotifications(pageFromUrl);
  }, [fetchNotifications, getPage, queryKey]);

  // Sync with header dropdown via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel("notification_sync");
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const { type, role, notifId } = event.data || {};
      if (role !== "candidate") return;
      if (type === "notification_read" && notifId) {
        setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else if (type === "notifications_read_all") {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      } else if (type === "notification_count_update" && typeof event.data.unreadCount === "number") {
        setUnreadCount(event.data.unreadCount);
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const handleMarkAllRead = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/notifications/read-all`, {
      method: "PATCH",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setNotifications(notifications.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
          channelRef.current?.postMessage({ type: "notifications_read_all", role: "candidate" });
        } else {
          toast.error(data.message || "Unable to update notifications. Please try again.");
        }
      })
      .catch(() => toast.error("Unable to update notifications. Please try again."));
  };

  const handleNotificationClick = (notifId: string, isRead: boolean) => {
    if (isRead) return; // Already read, no need to update
    
    // Mark as read immediately in UI
    setNotifications(notifications.map(n =>
      n._id === notifId ? { ...n, read: true } : n
    ));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Broadcast to header dropdown
    channelRef.current?.postMessage({ type: "notification_read", role: "candidate", notifId });

    // Send to backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/notification/${notifId}/read`, {
      method: "PATCH",
      credentials: "include"
    }).catch(() => {
      // Best-effort sync; keep optimistic UI.
    });
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <Toaster richColors position="top-right" />
      <div className="container">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[24px]">
          <div className="flex items-center gap-[12px]">
            <div className="w-[48px] h-[48px] bg-gradient-to-br from-[#0088FF] to-[#0066CC] rounded-full flex items-center justify-center">
              <FaBell className="text-[20px] text-white" />
            </div>
            <div>
              <h1 className="font-[700] text-[24px] text-[#121212]">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-[14px] text-[#666]">
                  You have <span className="font-[600] text-[#0088FF]">{unreadCount}</span> unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-[20px] py-[10px] bg-[#0088FF] text-white rounded-[8px] text-[14px] font-[600] hover:bg-[#0070d6] cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[#0088FF]/25 active:scale-[0.98]"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-[60px] text-[#666]">Loading...</div>
        ) : errorMessage ? (
          <div className="text-center py-[60px] bg-[#F9F9F9] rounded-[12px]">
            <p className="text-[14px] text-[#666] mb-[12px]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => fetchNotifications(currentPage)}
              className="inline-block rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] px-[16px] py-[8px] text-[14px] font-[600] text-white hover:from-[#0077EE] hover:to-[#0055BB]"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="text-center py-[60px] bg-[#F9F9F9] rounded-[12px]">
            <div className="w-[80px] h-[80px] bg-[#E5E5E5] rounded-full flex items-center justify-center mx-auto mb-[16px]">
              <FaBell className="text-[32px] text-[#999]" />
            </div>
            <h3 className="font-[600] text-[18px] text-[#333] mb-[8px]">No notifications yet</h3>
            <p className="text-[14px] text-[#666]">When you receive notifications, they&apos;ll appear here</p>
          </div>
        ) : (
          <>
            {/* Notification List */}
            <div className="space-y-[12px]">
              {notifications.map((notif) => (
                <Link
                  key={notif._id}
                  href={notif.link || "#"}
                  onClick={() => handleNotificationClick(notif._id, notif.read)}
                  className={`block p-[16px] border rounded-[12px] cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#0088FF] group ${
                    !notif.read 
                      ? 'bg-gradient-to-r from-blue-50 to-white border-blue-200' 
                      : 'bg-white border-[#E5E5E5] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-start gap-[14px]">
                    {/* Icon */}
                    <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0 text-[18px] transition-transform duration-200 group-hover:scale-110 ${
                      !notif.read ? 'bg-white shadow-sm' : 'bg-[#F5F5F5]'
                    }`}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-[12px]">
                        <div className="flex-1">
                          <div className={`text-[15px] mb-[4px] ${!notif.read ? 'font-[700] text-[#121212]' : 'font-[500] text-[#333]'}`}>
                            {notif.title}
                          </div>
                          <div className="text-[14px] text-[#666] mb-[6px] line-clamp-2">
                            {notif.message}
                          </div>
                          <div className="text-[12px] text-[#999]">
                            {timeAgo(notif.createdAt)}
                          </div>
                        </div>
                        
                        {/* Unread indicator */}
                        {!notif.read && (
                          <div className="w-[10px] h-[10px] bg-[#0088FF] rounded-full flex-shrink-0 mt-[6px] animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPage={pagination?.totalPage || 1}
              totalRecord={pagination?.totalRecord || 0}
              skip={(currentPage - 1) * (pagination?.pageSize || 10)}
              currentCount={notifications.length}
              onPageChange={(page) => {
                setCurrentPage(page);
                replaceQuery({ page });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
