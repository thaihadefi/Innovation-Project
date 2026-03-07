"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { FaBell } from "react-icons/fa6";
import Link from "next/link";
import { useAdminSocket } from "@/hooks/useAdminSocket";
import { notificationConfig } from "@/configs/variable";
import { NotificationItemSkeleton } from "@/app/components/ui/Skeleton";

interface AdminNotificationDropdownProps {
  initialUnreadCount?: number;
}

export const AdminNotificationDropdown = ({ initialUnreadCount }: AdminNotificationDropdownProps) => {
  const { newNotification, clearNewNotification } = useAdminSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount ?? 0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pulseBadge, setPulseBadge] = useState(false);
  const [badgeReady, setBadgeReady] = useState(initialUnreadCount !== undefined);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const hasFetchedOnceRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const fetchNotifications = useCallback(() => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    if (!hasFetchedOnceRef.current) setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notifications`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (controller.signal.aborted) return;
        if (data.code === "success") {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
          channelRef.current?.postMessage({ type: "notification_count_update", role: "admin", unreadCount: data.unreadCount || 0 });
        }
        hasFetchedOnceRef.current = true;
        setBadgeReady(true);
        setLoading(false);
      })
      .catch((error: any) => {
        if (error?.name === "AbortError") return;
        setBadgeReady(true);
        setLoading(false);
      });
  }, []);

  // Fetch once on mount to get badge count
  useEffect(() => {
    fetchNotifications();
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, [fetchNotifications]);

  // Re-fetch every time dropdown is opened
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle real-time new notification
  useEffect(() => {
    if (newNotification) {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setPulseBadge(true);
      const timer = setTimeout(() => setPulseBadge(false), 1500);
      clearNewNotification();
      return () => clearTimeout(timer);
    }
  }, [newNotification, clearNewNotification]);

  // Sync with full notifications page via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel("notification_sync");
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const { type, role, notifId } = event.data || {};
      if (role !== "admin") return;
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notifications/read-all`, {
      method: "PATCH",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setUnreadCount(0);
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          channelRef.current?.postMessage({ type: "notifications_read_all", role: "admin" });
        }
      });
  };

  const handleNotificationClick = (notifId: string, isRead: boolean) => {
    if (isRead) return;
    
    setNotifications(prev => prev.map(n =>
      n._id === notifId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Broadcast to full notifications page
    channelRef.current?.postMessage({ type: "notification_read", role: "admin", notifId });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notification/${notifId}/read`, {
      method: "PATCH",
      credentials: "include"
    });
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Show only first N in dropdown
  const displayNotifications = notifications.slice(0, notificationConfig.dropdownLimit);

  return (
    <div 
      className="relative mr-[8px]"
      onMouseEnter={handleOpen}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="relative p-[8px] rounded-[8px] hover:bg-[#F5F7FA] transition-colors cursor-pointer">
        <FaBell className="text-[18px] text-[#6B7280]" />
        {badgeReady && unreadCount > 0 && (
          <span className={`absolute top-[2px] right-[2px] min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-[700] rounded-full flex items-center justify-center px-[3px] transition-transform ${pulseBadge ? "scale-125" : "scale-100"}`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[100%] pt-[8px] z-[200]">
          <div className="w-[340px] max-w-[calc(100vw-32px)] bg-white border border-[#DEDEDE] rounded-[8px] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-[12px] border-b border-[#DEDEDE]">
              <h3 className="font-[700] text-[14px] text-[#121212]">
                Notifications {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[12px] text-[#0088FF] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <>
                  <NotificationItemSkeleton />
                  <NotificationItemSkeleton />
                  <NotificationItemSkeleton />
                </>
              ) : displayNotifications.length === 0 ? (
                <div className="p-[20px] text-center text-[#666]">No notifications yet</div>
              ) : (
                displayNotifications.map((notif) => (
                  <Link
                    key={notif._id}
                    href={notif.link || "#"}
                    onClick={() => handleNotificationClick(notif._id, notif.read)}
                    className={`block p-[12px] border-b border-[#f0f0f0] hover:bg-gray-50 ${!notif.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-[8px]">
                      <div className="flex-1">
                        <div className="font-[600] text-[13px] text-[#121212] mb-[4px]">
                          {notif.title}
                        </div>
                        <div className="text-[12px] text-[#666] mb-[4px] line-clamp-2">
                          {notif.message}
                        </div>
                        <div className="text-[11px] text-[#999]">
                          {timeAgo(notif.createdAt)}
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="w-[8px] h-[8px] bg-blue-500 rounded-full flex-shrink-0 mt-[4px]"></div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* See All link - always show if there are notifications */}
            {notifications.length > 0 && (
              <Link
                href="/admin-manage/notifications"
                className="block p-[12px] text-center text-[14px] font-[600] text-[#0088FF] hover:bg-gray-50 border-t border-[#DEDEDE]"
              >
                See All Notifications
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
