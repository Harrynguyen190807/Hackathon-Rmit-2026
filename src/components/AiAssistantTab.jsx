import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  Sparkles,
  Pill,
  Sun,
  ShieldAlert,
  Ban,
  Droplets,
  Utensils,
  Send,
  Lock,
  CheckCircle2,
  Info,
  Clock,
} from 'lucide-react';
import TideCloakBadge from './TideCloakBadge';
import { processZeroTrustAiQuery } from '../services/tidecloak';

const QUICK_SUGGESTIONS = [
  { label: 'Tác dụng phụ?', query: 'Thuốc này có gây tác dụng phụ gì phổ biến không?' },
  { label: 'Uống trước hay sau ăn?', query: 'Tôi nên uống các thuốc này trước hay sau ăn?' },
  { label: 'Cần kiêng cữ gì thêm?', query: 'Tôi cần kiêng cữ thực phẩm gì khi uống đơn này?' },
  { label: 'Kết nối bác sĩ', query: 'Làm sao để cấp quyền cho bác sĩ xem hồ sơ qua TideCloak?' },
];

export default function AiAssistantTab({ prescription, initialEdgeProof }) {
  const [inputVal, setInputVal] = useState('');
  const [latestProof, setLatestProof] = useState(initialEdgeProof);
  const [messages, setMessages] = useState([
    {
      id: 'msg-init-user',
      role: 'user',
      time: '09:34',
      text: 'Thuốc này có gây tác dụng phụ gì phổ biến không? Và lỡ nếu quên uống một liều thì xử trí như thế nào?',
    },
    {
      id: 'msg-init-ai',
      role: 'ai',
      time: '09:34',
      text: 'Dựa trên hồ sơ dược lý ẩn danh (Zero-Knowledge Attested), dưới đây là lưu ý an toàn cho đơn thuốc của bạn:',
      highlights: [
        {
          title: 'Tác dụng phụ thường gặp',
          detail:
            'Buồn ngủ nhẹ, đỏ bừng mặt hoặc hơi phù cổ chân vào chiều tối. Thường giảm sau 1–2 tuần.',
          type: 'warning',
        },
        {
          title: 'Xử trí khi quên liều',
          detail:
            'Nếu đã gần tới giờ của liều tiếp theo (dưới 12 tiếng), hãy bỏ qua liều đã quên. Tuyệt đối không uống gấp đôi liều để bù.',
          type: 'critical',
        },
      ],
      zkProofSignature: initialEdgeProof?.zkProofSignature || '0x9a3d7f1c...e082b4',
    },
  ]);

  const endOfChatRef = useRef(null);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendQuery = (customQuery) => {
    const queryText = (customQuery ?? inputVal).trim();
    if (!queryText) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: 'usr-' + Date.now(),
      role: 'user',
      time: nowTime,
      text: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputVal('');

    setTimeout(() => {
      const result = processZeroTrustAiQuery(queryText, prescription);
      setLatestProof(result.edgeProof);
      const aiMsg = {
        id: 'ai-' + Date.now(),
        role: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: result.reply,
        highlights: result.highlights,
        zkProofSignature: result.edgeProof.zkProofSignature,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 400);
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-3.5">
      {/* Context Bar (From Stitch AI Bác Sĩ Giải Mã) */}
      <div className="flex items-center justify-between w-full bg-white rounded-2xl p-3 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#c7e89e] to-[#c4ebda] flex items-center justify-center text-[#0b3026] shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4b662b] rounded-full ring-2 ring-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#1A201C]">Asclepios AI Bác Sĩ</span>
              <CheckCircle2 className="w-4 h-4 text-[#4b662b] fill-[#cceda3]" />
            </div>
            <span className="text-xs text-[#687771]">
              Tư vấn dược lâm sàng Zero-Trust 24/7
            </span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#f6f3ed] text-[#0b3026] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Lock className="w-3 h-3 text-[#4b662b]" /> E2E ZKP
        </span>
      </div>

      {/* Prominent TideCloak Verification Banner on AI Screen */}
      <TideCloakBadge
        proofData={latestProof}
        contextLabel="Zero-Knowledge Proof Verified • Anonymous AI Context"
      />

      {/* Prescription Floating Context Pill */}
      <div className="flex items-center justify-center w-full">
        <div className="inline-flex items-center gap-2 bg-[#ebe8e2] px-3.5 py-1.5 rounded-full shadow-sm max-w-full">
          <Pill className="w-3.5 h-3.5 text-[#0b3026] shrink-0" />
          <span className="text-xs text-[#1A201C] font-medium truncate">
            {prescription.title}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#4b662b] shrink-0" />
          <span className="text-[10px] text-[#4b662b] font-bold uppercase tracking-wider shrink-0">
            Đã ẩn PII
          </span>
        </div>
      </div>

      {/* Pinned AI Prescription Breakdown Card (From Stitch AI Screen) */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0b3026] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#4b662b]" />
            Tóm tắt phác đồ & Tương tác dinh dưỡng
          </span>
          <span className="text-[10px] font-mono text-[#687771]">Dược thư QGVN</span>
        </div>

        <div className="w-full bg-[#f6f3ed] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#1A201C]">
                {prescription.medications[0]?.name} ({prescription.medications[0]?.dosage})
              </h4>
              <p className="text-[11px] text-[#687771]">
                {prescription.medications[0]?.category}
              </p>
            </div>
            <span className="bg-[#c7e89e] text-[#0b3026] text-[10px] font-bold px-2.5 py-1 rounded-full">
              {prescription.medications[0]?.time} • {prescription.medications[0]?.period}
            </span>
          </div>
          <div className="h-[1px] w-full bg-[#e5e2dc]" />
          <div className="space-y-1 text-xs text-[#1A201C]">
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#4b662b] shrink-0" />
              <span>
                <strong>Lời khuyên vàng:</strong> Uống cố định {prescription.medications[0]?.time} mỗi ngày.
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#F3A871] shrink-0" />
              <span>Duy trì liên tục, không tự ý ngắt liều khi huyết áp ổn định.</span>
            </div>
          </div>
        </div>

        {/* Dietary Restrictions Badges */}
        <div className="w-full bg-gradient-to-r from-[#D5EDAF]/40 to-[#E9F6D6]/50 rounded-xl p-3 space-y-2">
          <span className="text-[10px] font-bold text-[#0b3026] uppercase tracking-wider">
            Cảnh báo dinh dưỡng tương tác
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm text-xs text-[#1A201C]">
              <Ban className="w-3.5 h-3.5 text-[#ba1a1a]" /> Kiêng nước ép bưởi
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm text-xs text-[#1A201C]">
              <Droplets className="w-3.5 h-3.5 text-[#0b3026]" /> Uống đủ 2L nước
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm text-xs text-[#1A201C]">
              <Utensils className="w-3.5 h-3.5 text-[#4b662b]" /> Giảm muối (&lt;5g/ngày)
            </span>
          </div>
        </div>
      </div>

      {/* Medical Chat Thread Stream */}
      <div className="flex flex-col space-y-3 w-full">
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <div
              key={msg.id}
              className="flex flex-col items-end self-end max-w-[85%] space-y-1"
            >
              <span className="text-[10px] font-bold text-[#687771] px-2 uppercase">
                Bạn • {msg.time}
              </span>
              <div className="bg-[#24473b] text-white rounded-2xl rounded-tr-sm p-3.5 shadow-[0_10px_25px_-5px_rgba(11,48,38,0.22)]">
                <p className="text-xs leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ) : (
            <div
              key={msg.id}
              className="flex flex-col items-start max-w-[94%] space-y-1"
            >
              <div className="flex items-center gap-1.5 px-2">
                <Sparkles className="w-3.5 h-3.5 text-[#4b662b]" />
                <span className="text-[10px] font-bold text-[#687771] uppercase">
                  Asclepios AI • {msg.time}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c7e89e]/60 text-[#0b3026] font-mono font-bold">
                  ZKP: {msg.zkProofSignature?.slice(0, 10)}...
                </span>
              </div>
              <div className="w-full bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.05)] border border-[#ECE7DC] space-y-2.5">
                <p className="text-xs text-[#1A201C] leading-relaxed">{msg.text}</p>

                {msg.highlights && msg.highlights.length > 0 && (
                  <div className="space-y-2">
                    {msg.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#f6f3ed]"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            h.type === 'critical'
                              ? 'bg-[#ffdad6] text-[#93000a]'
                              : h.type === 'warning'
                              ? 'bg-[#F3A871]/30 text-[#663304]'
                              : 'bg-[#cceda3] text-[#0b3026]'
                          }`}
                        >
                          {h.type === 'critical' ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-[#1A201C] block">
                            {h.title}
                          </span>
                          <p className="text-xs text-[#414845] leading-relaxed">
                            {h.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        <div ref={endOfChatRef} />
      </div>

      {/* Quick Horizontal Suggestion Chips (From Stitch AI Screen) */}
      <div className="w-full pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {QUICK_SUGGESTIONS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSendQuery(chip.query)}
              className="shrink-0 inline-flex items-center gap-1.5 bg-white hover:bg-[#e5e2dc] text-[#1A201C] px-3 py-2 rounded-full shadow-sm border border-[#ECE7DC] text-xs font-semibold transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4b662b]" />
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Bottom Chat Input Dock */}
      <div className="w-full bg-white rounded-2xl p-2 shadow-[0_10px_30px_-5px_rgba(36,71,59,0.08)] border border-[#ECE7DC] flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          placeholder="Hỏi bảo mật về liều lượng, tương tác thuốc..."
          className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-[#1A201C] text-xs placeholder:text-[#687771] px-2 py-2"
        />
        <button
          type="button"
          onClick={() => handleSendQuery()}
          aria-label="Send message"
          className="w-9 h-9 rounded-full bg-[#24473b] text-white flex items-center justify-center shadow-sm shrink-0 hover:bg-[#0b3026] active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Minimal Clinical Badge Bottom Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[#687771]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#4b662b]" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          Secured by TideCloak • Zero-Knowledge Proof Verified
        </span>
      </div>
    </div>
  );
}
