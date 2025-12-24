/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa6";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { notificationConfig } from "@/configs/variable";

export const NotificationDropdown = () => {
  const { isLogin, infoCandidate } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLogin || !infoCandidate) {
      setLoading(false);
      return;
    }

    fetchNotifications();
  }, [isLogin, infoCandidate]);

  const fetchNotifications = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/notifications`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleMarkAllRead = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/notifications/read-all`, {
      method: "PATCH",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setUnreadCount(0);
          setNotifications(notifications.map(n => ({ ...n, read: true })));
        }
      });
  };

  const handleNotificationClick = (notifId: string, isRead: boolean) => {
    if (isRead) return; // Already read, no need to update
    
    // Mark as read immediately in UI
    setNotifications(notifications.map(n => 
      n._id === notifId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Send to backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/notification/${notifId}/read`, {
      method: "PATCH",
      credentials: "include"
    });
  };

  // Only show for logged in candidates
  if (!isLogin || !infoCandidate) return null;

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="relative p-[10px] rounded-full hover:bg-white/20 transition-colors cursor-pointer">
        <FaBell className="text-[22px] text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-[2px] right-[2px] min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-[700] rounded-full flex items-center justify-center px-[4px] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[100%] pt-[8px] z-[200]">
          <div className="w-[340px] bg-white border border-[#DEDEDE] rounded-[8px] shadow-lg overflow-hidden">
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
                <div className="p-[20px] text-center text-[#666]">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-[20px] text-center text-[#666]">No notifications yet</div>
              ) : (
                notifications.slice(0, notificationConfig.dropdownLimit).map((notif) => (
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
                href="/candidate-manage/notifications"
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
