"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBell } from "react-icons/fa6";
import { Toaster, toast } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useListQueryState } from "@/hooks/useListQueryState";

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/notifications?${params.toString()}`, {
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
        channelRef.current?.postMessage({ type: "notification_count_update", role: "company", unreadCount: data.unreadCount || 0 });
      } else if (!silent) {
        setErrorMessage("Unable to load notifications. Please try again.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError" && !silent) {
        console.error("Failed to fetch company notifications:", error);
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
      if (role !== "company") return;
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/notifications/read-all`, {
      method: "PATCH",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setNotifications(notifications.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
          channelRef.current?.postMessage({ type: "notifications_read_all", role: "company" });
        } else {
          toast.error(data.message || "Unable to update notifications. Please try again.");
        }
      })
      .catch(() => toast.error("Unable to update notifications. Please try again."));
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

        {loading ? (
          <div className="text-center py-[40px] text-[#666]">Loading...</div>
        ) : errorMessage ? (
          <div className="text-center py-[40px]">
            <p className="text-[#666] mb-[12px]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => fetchNotifications(currentPage)}
              className="inline-block rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] px-[16px] py-[8px] text-[14px] font-[600] text-white hover:from-[#0077EE] hover:to-[#0055BB]"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
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
                replaceQuery({ page });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
