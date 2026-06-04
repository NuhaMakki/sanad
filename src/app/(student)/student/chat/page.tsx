import { ChatWindow } from "@/components/chatbot/ChatWindow";

export default function StudentChatPage() {
  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-navy-900">المساعد الذكي</h2>
        <p className="text-sm text-gray-500">اسأل عن أي شيء يتعلق بجامعة الإمام، اللوائح، والإجراءات</p>
      </div>
      <div className="h-full">
        <ChatWindow context="GENERAL" />
      </div>
    </div>
  );
}
