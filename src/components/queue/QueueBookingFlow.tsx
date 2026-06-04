"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepLocation } from "./StepLocation";
import { StepIssueType } from "./StepIssueType";
import { StepChatbot } from "./StepChatbot";
import { StepConfirm } from "./StepConfirm";

export type BookingState = {
  unitId: string;
  unitName: string;
  locationType: "ONCAMPUS" | "OFFCAMPUS";
  issueTypeId: string;
  issueTypeName: string;
  chatSummary: string;
  sessionId: string;
};

interface Props {
  preselectedUnitId?: string;
}

const STEPS = ["الموقع", "نوع المشكلة", "الشات بوت", "التأكيد"];

export function QueueBookingFlow({ preselectedUnitId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(preselectedUnitId ? 1 : 0);
  const [state, setState] = useState<Partial<BookingState>>({
    unitId: preselectedUnitId,
    locationType: "ONCAMPUS",
  });

  const update = (partial: Partial<BookingState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const submit = async () => {
    const r = await fetch("/api/queue/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceUnitId: state.unitId,
        issueTypeId: state.issueTypeId,
        locationType: state.locationType,
        chatSummary: state.chatSummary || undefined,
      }),
    });
    const data = await r.json();
    if (r.ok) {
      router.push(`/student/queue/${data.data.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold
              ${i < step ? "bg-teal-600 text-white" : i === step ? "bg-navy-700 text-white" : "bg-gray-200 text-gray-500"}`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? "font-semibold text-navy-900" : "text-gray-500"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-teal-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepLocation
          value={state as BookingState}
          onChange={update}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <StepIssueType
          unitId={state.unitId!}
          onChange={update}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <StepChatbot
          unitId={state.unitId!}
          issueTypeId={state.issueTypeId!}
          onChange={update}
          onNext={() => setStep(3)}
          onSkip={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepConfirm
          state={state as BookingState}
          onBack={() => setStep(2)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
