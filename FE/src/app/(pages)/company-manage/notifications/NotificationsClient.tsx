"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBell } from "react-icons/fa6";
import { Toaster } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [notifications, setNotifications] = useState<any[]>(initialNotifications);
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const isFirstLoad = useRef(true);

  const fetchNotifications = async (page: number) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/notifications?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      setNotifications(data.notifications || []);
      setPagination(data.pagination || null);
      setUnreadCount(data.unreadCount || 0);
    }
  };

  useEffect(() => {
    const pageFromUrl = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    setCurrentPage((prev) => (prev === pageFromUrl ? prev : pageFromUrl));
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    fetchNotifications(pageFromUrl);
  }, [searchParams]);

  const handleMarkAllRead = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/notifications/read-all`, {
      method: "PATCH",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setNotifications(notifications.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
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

  const updateURL = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <Toaster richColors position="top-right" />
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
          <h1 className="font-[700] text-[24px] text-[#121212]">
            Notifications {unreadCount > 0 && <span className="text-red-500">({unreadCount} unread)</span>}
          </h1>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-[16px] py-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white rounded-[8px] text-[14px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-[40px]">
            <FaBell className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <p className="text-[#666]">No notifications yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-[12px]">
              {notifications.map((notif) => (
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
            <Pagination
              currentPage={currentPage}
              totalPage={pagination?.totalPage || 1}
              totalRecord={pagination?.totalRecord || 0}
              skip={(currentPage - 1) * (pagination?.pageSize || 10)}
              currentCount={notifications.length}
              onPageChange={(page) => {
                setCurrentPage(page);
                updateURL(page);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
