import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Image,
  Paperclip,
  User,
  CheckCheck,
  Trophy,
  Briefcase,
  ShieldCheck,
  Circle
} from 'lucide-react';
import {
  Conversation,
  ChatMessage,
  listenUserConversations,
  listenConversationMessages,
  sendChatMessage,
  getOrCreateConversation,
  UserProfile
} from '../services/firebaseService';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  targetUser?: {
    uid: string;
    name: string;
    avatar: string;
    role: string;
  } | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [showMediaField, setShowMediaField] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations list for current user
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const unsubscribe = listenUserConversations(currentUser.uid, (list) => {
      setConversations(list);

      // If target user provided, open or create conversation
      if (targetUser && targetUser.uid !== currentUser.uid) {
        getOrCreateConversation(
          {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Usuario',
            avatar: currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            role: currentUser.role
          },
          targetUser
        ).then((convId) => {
          setActiveConversationId(convId);
        });
      } else if (!activeConversationId && list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser, isOpen, targetUser]);

  // Listen to messages of active conversation
  useEffect(() => {
    if (!activeConversationId || !isOpen) return;

    const unsubscribe = listenConversationMessages(activeConversationId, (msgList) => {
      setMessages(msgList);
    });

    return () => unsubscribe();
  }, [activeConversationId, isOpen]);

  if (!isOpen || !currentUser) return null;

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Helper to find recipient info
  const otherParticipantId = activeConversation?.participants.find(p => p !== currentUser.uid);
  const otherParticipant = otherParticipantId && activeConversation?.participantDetails
    ? activeConversation.participantDetails[otherParticipantId]
    : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessageText.trim() && !mediaUrlInput.trim()) || !activeConversationId) return;

    const textToSend = newMessageText;
    const mediaToSend = mediaUrlInput;

    setNewMessageText('');
    setMediaUrlInput('');
    setShowMediaField(false);

    try {
      await sendChatMessage(
        activeConversationId,
        currentUser.uid,
        textToSend,
        mediaToSend
      );
    } catch (err) {
      console.error('Error sending chat message:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDEBAR: Conversations List */}
        <div className="w-full md:w-1/3 bg-[#0a0a0c] border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#00ff41]" />
              <h3 className="font-black text-white uppercase italic text-sm">
                Chat Privado
              </h3>
            </div>
            <span className="text-[10px] bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 font-bold px-2 py-0.5 rounded">
              Tiempo Real
            </span>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-white/40 text-xs">
                No tienes chats activos aún. Explora perfiles de deportistas o clubes para iniciar una conversación.
              </div>
            ) : (
              conversations.map((c) => {
                const partnerId = c.participants.find(p => p !== currentUser.uid);
                const partner = partnerId && c.participantDetails ? c.participantDetails[partnerId] : null;

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`w-full p-3.5 text-left transition-colors flex items-center gap-3 hover:bg-white/5 ${
                      c.id === activeConversationId ? 'bg-white/10 border-l-4 border-[#00ff41]' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={partner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={partner?.name || 'Usuario'}
                        className="w-10 h-10 rounded-xl object-cover border border-white/20"
                      />
                      <Circle className="w-2.5 h-2.5 text-[#00ff41] fill-[#00ff41] absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs truncate">
                          {partner?.name || 'Contacto TalentMatch'}
                        </h4>
                        <span className="text-[9px] text-white/40 font-mono">
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">
                        {c.lastMessage || 'Conversación iniciada'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT AREA: Active Chat View */}
        <div className="flex-1 flex flex-col bg-[#161618]">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121214]">
            {otherParticipant ? (
              <div className="flex items-center gap-3">
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#00ff41]/40"
                />
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    {otherParticipant.name}
                    <ShieldCheck className="w-4 h-4 text-[#00ff41]" title="Perfil Verificado" />
                  </h3>
                  <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                    {otherParticipant.role === 'club' ? 'Club / Entrenador' : 'Deportista / Atleta'} • En línea
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-white/60 text-xs font-bold">
                Selecciona una conversación para chatear
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d0d0f]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 text-xs">
                <MessageSquare className="w-10 h-10 text-[#00ff41]/40 mb-2" />
                <p className="font-bold">Escribe un mensaje para iniciar el scouteo o coordinar una prueba deportiva.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === currentUser.uid;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-md space-y-1.5 ${
                        isMe
                          ? 'bg-[#00ff41] text-black rounded-tr-none font-medium'
                          : 'bg-[#1e1e22] text-white border border-white/10 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                      {m.mediaUrl && (
                        <img
                          src={m.mediaUrl}
                          alt="Adjunto"
                          className="rounded-xl max-h-48 object-cover border border-black/20 mt-1"
                        />
                      )}

                      <div className={`text-[9px] text-right font-mono ${isMe ? 'text-black/60' : 'text-white/40'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Optional Media URL input */}
          {showMediaField && (
            <div className="p-2 px-4 bg-[#121214] border-t border-white/10 flex items-center gap-2">
              <Image className="w-4 h-4 text-[#00ff41] shrink-0" />
              <input
                type="text"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                placeholder="Pega la URL de una foto o jugada (https://...)"
                className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#121214] border-t border-white/10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMediaField(!showMediaField)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-[#00ff41] transition-all"
              title="Adjuntar imagen o video"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Escribe tu mensaje técnico o consulta..."
              className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ff41]"
            />

            <button
              type="submit"
              disabled={!newMessageText.trim() && !mediaUrlInput.trim()}
              className="px-4 py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
