"use client";

import { useEffect, useState, use } from "react";
import { usePolling } from "@/hooks/usePolling";
import { TicketStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Clock, Users, MapPin, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Ticket {
  id: string;
  status: string;
  locationType: string;
  chatSummary: string | null;
  createdAt: string;
  serviceUnit: { id: string; name: string };
  issueType: { name: string } | null;
  messages: { id: string; content: string; createdAt: string; sender: { name: string; role: string } }[];
}

interface QueuePos {
  position: number;
  totalWaiting: number;
  etaMinutes: number;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [queuePos, setQueuePos] = useState<QueuePos | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    const r = await fetch(`/api/queue/tickets/${id}`);
    if (r.ok) {
      const d = await r.json();
      setTicket(d.data);
    }
    setLoading(false);
  };

  const fetchPos = async () => {
    if (!ticket?.serviceUnit?.id) return;
    const r = await fetch(`/api/queue/status/${ticket.serviceUnit.id}?ticketId=${id}`);
    if (r.ok) {
      const d = await r.json();
      setQueuePos(d.data);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);
  usePolling(fetchTicket);
  usePolling(fetchPos, 10000, !!ticket?.serviceUnit?.id);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setMessage("");
    await fetch(`/api/queue/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    await fetchTicket();
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!ticket) return <p className="text-gray-500">لم يُعثر على الطلب.</p>;

  const isActive = ["WAITING", "SERVING"].includes(ticket.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status header */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">الوحدة الخدمية</p>
            <h2 className="text-xl font-bold text-navy-900">{ticket.serviceUnit.name}</h2>
            {ticket.issueType && <p className="text-sm text-gray-600 mt-1">{ticket.issueType.name}</p>}
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <InfoItem icon={<MapPin className="h-4 w-4" />} label="الموقع"
            value={ticket.locationType === "ONCAMPUS" ? "داخل الجامعة" : "خارج الجامعة"} />
          {queuePos && isActive && (
            <>
              <InfoItem icon={<Users className="h-4 w-4" />} label="موقعك في الطابور"
                value={`${queuePos.position} من ${queuePos.totalWaiting}`} highlight />
              <InfoItem icon={<Clock className="h-4 w-4" />} label="الوقت المتوقع"
                value={`${queuePos.etaMinutes} دقيقة`} />
            </>
          )}
        </div>
      </Card>

      {/* Queue number (prominent) */}
      {isActive && queuePos && (
        <div className="bg-navy-700 text-white rounded-2xl p-8 text-center">
          <p className="text-navy-300 text-sm mb-2">رقمك في الطابور</p>
          <p className="text-7xl font-bold">{queuePos.position}</p>
          <p className="text-navy-300 text-sm mt-2">
            {queuePos.position === 1 ? "دورك الآن!" :
             queuePos.position <= 3 ? "اقترب دورك، كن مستعداً" :
             "يرجى الانتظار"}
          </p>
        </div>
      )}

      {/* Messages */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-teal-500" />
          <h3 className="font-semibold text-navy-900">المحادثة</h3>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
          {ticket.messages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">لا توجد رسائل بعد</p>
          ) : (
            ticket.messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender.role === "STUDENT" ? "items-end" : "items-start"}`}>
                <div className={`max-w-xs rounded-xl px-4 py-2 text-sm
                  ${msg.sender.role === "STUDENT" ? "bg-navy-700 text-white" : "bg-gray-100 text-gray-800"}`}>
                  {msg.content}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {msg.sender.role === "STUDENT" ? "أنت" : msg.sender.name}
                </p>
              </div>
            ))
          )}
        </div>
        {isActive && (
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="اكتب رسالة..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4 rotate-180" />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoItem({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-xs text-gray-500">{icon}{label}</div>
      <p className={`font-semibold ${highlight ? "text-2xl text-navy-700" : "text-sm text-gray-900"}`}>{value}</p>
    </div>
  );
}
