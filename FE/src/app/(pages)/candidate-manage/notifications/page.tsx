/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBell } from "react-icons/fa6";
import { Toaster } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/notifications`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setNotifications(data.notifications);
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
          setNotifications(notifications.map(n => ({ ...n, read: true })));
        }
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

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="pt-[30px] pb-[60px]">
      <Toaster richColors position="top-right" />
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
          <h1 className="font-[700] text-[24px] text-[#121212]">
            Notifications {unreadCount > 0 && <span className="text-red-500">({unreadCount} unread)</span>}
          </h1>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-[16px] py-[8px] bg-[#0088FF] text-white rounded-[4px] text-[14px] font-[600] hover:bg-[#0077DD]"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-[40px] text-[#666]">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-[40px]">
            <FaBell className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <p className="text-[#666]">No notifications yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-[12px]">
              {paginatedNotifications.map((notif) => (
                <Link
                  key={notif._id}
                  href={notif.link || "#"}
                  className={`block p-[16px] border rounded-[8px] hover:border-[#0088FF] transition-colors ${!notif.read ? 'bg-blue-50 border-blue-200' : 'border-[#DEDEDE]'}`}
                >
                  <div className="flex items-start justify-between gap-[12px]">
                    <div className="flex-1">
                      <div className="font-[600] text-[15px] text-[#121212] mb-[4px]">
                        {notif.title}
                      </div>
                      <div className="text-[14px] text-[#666] mb-[8px]">
                        {notif.message}
                      </div>
                      <div className="text-[12px] text-[#999]">
                        {timeAgo(notif.createdAt)}
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="w-[10px] h-[10px] bg-blue-500 rounded-full flex-shrink-0 mt-[6px]"></div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-[8px] mt-[24px]">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-[12px] py-[8px] rounded-[4px] border border-[#DEDEDE] disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-[12px] py-[8px] text-[14px]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-[12px] py-[8px] rounded-[4px] border border-[#DEDEDE] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
