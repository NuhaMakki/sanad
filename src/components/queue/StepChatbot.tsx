"use client";

import { useState } from "react";
import { BookingState } from "./QueueBookingFlow";
import { Button } from "@/components/ui/Button";
import { ChatWindow } from "@/components/chatbot/ChatWindow";

interface Props {
  unitId: string;
  issueTypeId: string;
  onChange: (v: Partial<BookingState>) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function StepChatbot({ onChange, onNext, onSkip, onBack }: Props) {
  const [summary, setSummary] = useState("");
  const [sessionId, setSessionId] = useState<string>("");

  const handleSummary = (s: string) => {
    setSummary(s);
    onChange({ chatSummary: s });
  };

  const handleNext = () => {
    onChange({ chatSummary: summary, sessionId });
    onNext();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-navy-900 mb-1">وصف المشكلة</h2>
        <p className="text-sm text-gray-500">
          أخبر مساعدنا الذكي عن مشكلتك لنتمكن من خدمتك بشكل أفضل. يمكنك تخطي هذه الخطوة.
        </p>
      </div>

      <div className="h-72">
        <ChatWindow
          context="QUEUE"
          onSummaryReady={handleSummary}
          placeholder="صف مشكلتك باختصار..."
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          السابق
        </Button>
        <Button variant="ghost" onClick={onSkip} className="flex-1">
          تخطي
        </Button>
        <Button onClick={handleNext} className="flex-1">
          التالي
        </Button>
      </div>
    </div>
  );
}
