"use client";

import { useState, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import { TicketStatusBadge, RiskBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MessageSquare, CheckCircle, XCircle, PhoneCall, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";

interface Ticket {
  id: string;
  status: string;
  locationType: string;
  chatSummary: string | null;
  createdAt: string;
  student: {
    studentNumber: string;
    gpa: number;
    warningCount: number;
    isGraduating: boolean;
    user: { name: string };
    riskScores: { score: number; level: string }[];
  };
  issueType: { name: string; priority: string } | null;
  messages: { id: string; content: string; isInternal: boolean; createdAt: string; senderId: string }[];
}

export default function StaffDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTickets = useCallback(async () => {
    const r = await fetch("/api/queue/tickets");
    if (r.ok) {
      const d = await r.json();
      setTickets(d.data ?? []);
    }
    setLoading(false);
  }, []);

  usePolling(fetchTickets);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/queue/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTickets();
    if (activeTicket?.id === id) setActiveTicket(null);
  };

  const sendMessage = async (ticketId: string) => {
    if (!message.trim() || sending) return;
    setSending(true);
    await fetch(`/api/queue/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    setMessage("");
    setSending(false);
    fetchTickets();
  };

  const waiting = tickets.filter((t) => t.status === "WAITING");
  const serving = tickets.filter((t) => t.status === "SERVING");

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-700">في الانتظار</p>
          <p className="text-3xl font-bold text-amber-800">{waiting.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700">يُخدم الآن</p>
          <p className="text-3xl font-bold text-green-800">{serving.length}</p>
        </div>
      </div>

      {/* Serving */}
      {serving.length > 0 && (
        <Card>
          <CardHeader><CardTitle>يُخدم الآن</CardTitle></CardHeader>
          <div className="space-y-3">
            {serving.map((t) => (
              <TicketRow
                key={t.id}
                ticket={t}
                onCall={() => updateStatus(t.id, "SERVING")}
                onResolve={() => updateStatus(t.id, "RESOLVED")}
                onNoShow={() => updateStatus(t.id, "NO_SHOW")}
                onMessage={() => setActiveTicket(t)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Waiting queue */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الانتظار</CardTitle>
        </CardHeader>
        {waiting.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">قائمة الانتظار فارغة</p>
        ) : (
          <div className="space-y-3">
            {waiting.map((t, idx) => (
              <TicketRow
                key={t.id}
                ticket={t}
                position={idx + 1}
                onCall={() => updateStatus(t.id, "SERVING")}
                onResolve={() => updateStatus(t.id, "RESOLVED")}
                onNoShow={() => updateStatus(t.id, "NO_SHOW")}
                onMessage={() => setActiveTicket(t)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Message modal */}
      <Modal
        open={!!activeTicket}
        onClose={() => setActiveTicket(null)}
        title={`مراسلة: ${activeTicket?.student.user.name}`}
      >
        {activeTicket && (
          <div className="space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {activeTicket.messages.length === 0 ? (
                <p className="text-xs text-gray-400 text-center">لا توجد رسائل</p>
              ) : activeTicket.messages.map((msg) => (
                <div key={msg.id} className="text-xs p-2 rounded-lg bg-gray-100 text-gray-800">
                  {msg.content}
                </div>
              ))}
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك للطالب..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTicket(null)} className="flex-1">إلغاء</Button>
              <Button onClick={() => sendMessage(activeTicket.id)} loading={sending} className="flex-1">إرسال</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TicketRow({
  ticket, position, onCall, onResolve, onNoShow, onMessage,
}: {
  ticket: Ticket;
  position?: number;
  onCall: () => void;
  onResolve: () => void;
  onNoShow: () => void;
  onMessage: () => void;
}) {
  const risk = ticket.student.riskScores[0];
  const waitMins = Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60000);

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
      {position && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-700 text-white font-bold text-sm">
          {position}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-navy-900">{ticket.student.user.name}</p>
          <span className="text-xs text-gray-500">{ticket.student.studentNumber}</span>
          {risk && <RiskBadge level={risk.level} />}
          <TicketStatusBadge status={ticket.status} />
        </div>
        {ticket.issueType && <p className="text-xs text-gray-600 mt-1">{ticket.issueType.name}</p>}
        {ticket.chatSummary && (
          <p className="text-xs text-gray-500 mt-1 italic truncate">{ticket.chatSummary}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <Clock className="h-3 w-3" />
          {waitMins} دقيقة انتظار
        </div>
      </div>
      <div className="flex gap-1 shrink-0 flex-wrap justify-end">
        {ticket.status === "WAITING" && (
          <Button size="sm" variant="secondary" onClick={onCall}>
            <PhoneCall className="h-3.5 w-3.5" />
            استدعاء
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onMessage}>
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onResolve}>
          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onNoShow}>
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
