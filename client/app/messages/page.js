'use client';

import { useEffect, useMemo, useState } from 'react';
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
      setMessagesByChat((current) => ({
        ...current,
        [message.chatId]: [...(current[message.chatId] || []), message]
      }));
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

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !activeContact || !profile?._id) return;

    try {
      const response = await chatService.sendMessage({
        recipientId: activeContact._id,
        content: draft.trim()
      });

      const message = response.data;
      setMessagesByChat((current) => ({
        ...current,
        [message.chatId]: [...(current[message.chatId] || []), message]
      }));
      socket?.emit('message', message);
      setDraft('');
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
                <p>{contact.latestMessage?.content || 'Start a conversation'}</p>
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
                      {message.content}
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
              <button type="button" className="composerMiniButton">+</button>
              <button type="button" className="composerMiniButton">IMG</button>
              <button type="button" className="composerMiniButton">GIF</button>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Aa" />
              <button type="submit" className="messagesSendButton">Send</button>
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
