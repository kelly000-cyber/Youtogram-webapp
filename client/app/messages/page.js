'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { chatService } from '../../services/chat';
import { useSocket } from '../../hooks/useSocket';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

function getInitials(name = 'YT') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'YT';
}

function getChatId(userId, recipientId) {
  return [String(userId), String(recipientId)].sort().join('_');
}

export default function MessagesPage() {
  const router = useRouter();
  const socket = useSocket(socketUrl);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [activeChatId, setActiveChatId] = useState('');
  const [draft, setDraft] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('youtogram_token');
    if (!token) {
      router.replace('/');
      return;
    }

    const loadChat = async () => {
      setLoading(true);
      setError('');

      try {
        const [profileResponse, usersResponse, conversationsResponse] = await Promise.all([
          authService.me(),
          authService.users(),
          chatService.conversations()
        ]);

        const currentProfile = profileResponse.data;
        const availableUsers = (usersResponse.data || []).filter((user) => user.isFriend);
        const convoMap = {};

        (conversationsResponse.data || []).forEach((conversation) => {
          if (conversation?.latestMessage?.chatId) {
            convoMap[conversation.latestMessage.chatId] = [conversation.latestMessage];
          }
        });

        setProfile(currentProfile);
        setUsers(availableUsers);
        setMessagesByChat(convoMap);

        if (availableUsers[0]?._id) {
          setActiveChatId(getChatId(currentProfile._id, availableUsers[0]._id));
        }
      } catch (loadError) {
        setError(loadError.message || 'Unable to load messages.');
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [router]);

  useEffect(() => {
    if (!socket || !profile?._id) return;

    socket.emit('join', { userId: profile._id });
    socket.on('presence:update', setOnlineUsers);
    socket.on('message', (message) => {
      setMessagesByChat((current) => {
        const existing = current[message.chatId] || [];
        if (existing.some((item) => String(item._id) === String(message._id))) return current;
        return { ...current, [message.chatId]: [...existing, message] };
      });
    });

    return () => {
      socket.off('presence:update', setOnlineUsers);
      socket.off('message');
    };
  }, [socket, profile]);

  useEffect(() => {
    if (!socket || !activeChatId) return;
    socket.emit('join-chat', { chatId: activeChatId });

    if (!messagesByChat[activeChatId]) {
      chatService.messages(activeChatId)
        .then((response) => {
          setMessagesByChat((current) => ({ ...current, [activeChatId]: response.data || [] }));
        })
        .catch((loadError) => setError(loadError.message || 'Unable to load chat messages.'));
    }
  }, [socket, activeChatId, messagesByChat]);

  const contacts = useMemo(() => {
    if (!profile?._id) return [];

    return users.map((user) => {
      const chatId = getChatId(profile._id, user._id);
      const chatMessages = messagesByChat[chatId] || [];
      const latestMessage = chatMessages[chatMessages.length - 1];

      return {
        ...user,
        chatId,
        latestMessage
      };
    });
  }, [users, profile, messagesByChat]);

  const activeContact = contacts.find((contact) => contact.chatId === activeChatId) || contacts[0];
  const activeMessages = activeChatId ? messagesByChat[activeChatId] || [] : [];

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = file.type.startsWith('image/') || file.type.startsWith('video/') || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'].includes(file.type);
    if (!allowed) {
      setError('This file type is not supported. Choose an image, video, GIF, sticker image, or document.');
      event.target.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Attachments must be 50 MB or smaller.');
      event.target.value = '';
      return;
    }
    setAttachment(file);
    setAttachmentPreview(file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : '');
    setError('');
  };

  const addSticker = (sticker) => {
    setDraft((current) => `${current}${current ? ' ' : ''}${sticker}`);
    setShowStickers(false);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if ((!draft.trim() && !attachment) || !activeContact || !profile?._id) return;

    try {
      const payload = new FormData();
      payload.append('recipientId', activeContact._id);
      payload.append('content', draft.trim());
      if (attachment) {
        payload.append('media', attachment);
        payload.append('messageType', attachment.type === 'image/gif' ? 'gif' : attachment.type.startsWith('image/') ? 'image' : attachment.type.startsWith('video/') ? 'video' : 'document');
      } else {
        payload.append('messageType', 'text');
      }

      const response = await chatService.sendMessage(payload);
      const message = response.data;
      setMessagesByChat((current) => {
        const existing = current[message.chatId] || [];
        if (existing.some((item) => String(item._id) === String(message._id))) return current;
        return { ...current, [message.chatId]: [...existing, message] };
      });
      setDraft('');
      setAttachment(null);
      setAttachmentPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (sendError) {
      setError(sendError.message || 'Unable to send message.');
    }
  };

  return (
    <main className="messagesPage">
      <aside className="messagesSidebar">
        <div className="messagesSidebarHeader">
          <h1>Chats</h1>
          <div className="messagesHeaderButtons">
            <button type="button" className="friendsCircleButton">...</button>
            <button type="button" className="friendsCircleButton">Edit</button>
          </div>
        </div>

        <div className="groupsSearchBox">
          <input type="text" placeholder="Search Messenger" aria-label="Search Messenger" />
        </div>

        <div className="messagesFilterTabs">
          <button type="button" className="activeMessageTab">All</button>
          <button type="button">Unread</button>
          <button type="button">Groups</button>
          <button type="button">Communities</button>
        </div>

        <div className="messagesConversationList">
          {contacts.map((contact) => (
            <button
              key={contact._id}
              type="button"
              className={`messageConversationItem ${contact.chatId === activeChatId ? 'activeConversationItem' : ''}`}
              onClick={() => setActiveChatId(contact.chatId)}
            >
              <div className="messageConversationAvatarWrap">
                {contact.avatar ? (
                  <img src={contact.avatar} alt={`${contact.username} avatar`} className="messageConversationAvatar" />
                ) : (
                  <div className="messageConversationAvatar fallbackAvatar">{getInitials(contact.username)}</div>
                )}
                {onlineUsers.includes(String(contact._id)) ? <span className="onlineDot" /> : null}
              </div>
              <div className="messageConversationMeta">
                <strong>{contact.username}</strong>
                <p>{contact.latestMessage?.content || (contact.latestMessage?.media?.length ? 'Attachment' : 'Start a conversation')}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="messagesMain">
        {loading ? (
          <div className="simplePageCard"><p>Loading chats...</p></div>
        ) : activeContact ? (
          <>
            <header className="messagesChatHeader">
              <div className="messagesChatUser">
                {activeContact.avatar ? (
                  <img src={activeContact.avatar} alt={`${activeContact.username} avatar`} className="messageConversationAvatar" />
                ) : (
                  <div className="messageConversationAvatar fallbackAvatar">{getInitials(activeContact.username)}</div>
                )}
                <div>
                  <strong>{activeContact.username}</strong>
                  <p>{onlineUsers.includes(String(activeContact._id)) ? 'Active now' : 'Offline'}</p>
                </div>
              </div>
              <div className="messagesChatActions">
                <button type="button" className="topbarIconButton">Call</button>
                <button type="button" className="topbarIconButton">Video</button>
                <button type="button" className="topbarIconButton">i</button>
              </div>
            </header>

            <div className="messagesThread">
              {activeMessages.length ? activeMessages.map((message) => {
                const mine = String(message.sender?._id || message.sender) === String(profile?._id);

                return (
                  <div key={message._id} className={`messageBubbleRow ${mine ? 'mineBubbleRow' : ''}`}>
                    <div className={`messageBubble ${mine ? 'myMessageBubble' : 'theirMessageBubble'}`}>
                      {Array.isArray(message.media) && message.media.length ? message.media.map((media, index) => (
                        media.type === 'image' || media.type === 'gif' ? <img key={`${message._id}-media-${index}`} src={media.url} alt={media.type === 'gif' ? 'GIF' : 'Shared image'} className="messageMediaImage" /> :
                        media.type === 'video' ? <video key={`${message._id}-media-${index}`} src={media.url} controls playsInline className="messageMediaVideo" /> :
                        <a key={`${message._id}-media-${index}`} href={media.url} target="_blank" rel="noreferrer" className="messageDocumentLink">📄 {media.fileName || 'Open document'}</a>
                      )) : null}
                      {message.content ? <span className="messageTextContent">{message.content}</span> : null}
                    </div>
                  </div>
                );
              }) : (
                <div className="messagesEmptyState">
                  <div className="messageConversationAvatar fallbackAvatar largeAvatar">{getInitials(activeContact.username)}</div>
                  <h2>{activeContact.username}</h2>
                  <p>Send the first message to start this real-time chat.</p>
                </div>
              )}
            </div>

            <form className="messagesComposer" onSubmit={handleSend}>
              <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" onChange={handleAttachmentChange} hidden />
              <button type="button" className="composerMiniButton" onClick={() => fileInputRef.current?.click()} aria-label="Attach photo, video or document">＋</button>
              <button type="button" className="composerMiniButton" onClick={() => fileInputRef.current?.click()} aria-label="Send image or GIF">IMG</button>
              <button type="button" className="composerMiniButton" onClick={() => setShowStickers((open) => !open)} aria-label="Open stickers">☺</button>
              <div className="messagesComposerInputWrap">
                {showStickers ? <div className="stickerPicker">{['😂','❤️','🔥','😍','👏','🎉','🥹','👍','✨','🤣'].map((sticker) => <button key={sticker} type="button" onClick={() => addSticker(sticker)}>{sticker}</button>)}</div> : null}
                {attachment ? <div className="messageAttachmentPreview">{attachmentPreview ? (attachment.type.startsWith('video/') ? <video src={attachmentPreview} muted playsInline /> : <img src={attachmentPreview} alt="Attachment preview" />) : <span>📄 {attachment.name}</span>}<button type="button" onClick={() => { setAttachment(null); setAttachmentPreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} aria-label="Remove attachment">×</button></div> : null}
                <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Aa" aria-label="Message" />
              </div>
              <button type="submit" className="messagesSendButton" disabled={!draft.trim() && !attachment}>Send</button>
            </form>
          </>
        ) : (
          <div className="simplePageCard"><p>No friends available yet. Add friends first to unlock real-time messaging.</p></div>
        )}
      </section>

      <aside className="messagesInfoPanel">
        {activeContact ? (
          <>
            <div className="messagesInfoTop">
              {activeContact.avatar ? (
                <img src={activeContact.avatar} alt={`${activeContact.username} avatar`} className="messagesInfoAvatar" />
              ) : (
                <div className="messagesInfoAvatar fallbackAvatar">{getInitials(activeContact.username)}</div>
              )}
              <h2>{activeContact.username}</h2>
              <p>{onlineUsers.includes(String(activeContact._id)) ? 'Active now' : 'Offline'}</p>
            </div>

            <div className="messagesInfoActions">
              <button type="button"><span>Me</span><span>Profile</span></button>
              <button type="button"><span>Off</span><span>Mute</span></button>
              <button type="button"><span>Go</span><span>Search</span></button>
            </div>

            <div className="messagesInfoSections">
              <button type="button">Chat info</button>
              <button type="button">Customize chat</button>
              <button type="button">Media & files</button>
              <button type="button">Privacy & support</button>
            </div>
          </>
        ) : null}
      </aside>

      {error ? <p className="feedErrorBanner messagesErrorBanner">{error}</p> : null}
    </main>
  );
}
