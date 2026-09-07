'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { liveService } from '../../services/live';
import { useSocket } from '../../hooks/useSocket';

const GIFTS = [
  { id: 'rose', label: '🌹 Rose', cost: 1 },
  { id: 'heart', label: '💖 Heart', cost: 2 },
  { id: 'fire', label: '🔥 Flame', cost: 3 },
  { id: 'crown', label: '👑 Crown', cost: 5 }
];

const SOCKET_BASE = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';

export default function LivePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isHosting, setIsHosting] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState([]);
  const [giftEvents, setGiftEvents] = useState([]);
  const [title, setTitle] = useState('Live now on Youtogram');
  const [description, setDescription] = useState('Join the live room to send gifts and enjoy the show.');
  const [statusText, setStatusText] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [socketError, setSocketError] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [mediaError, setMediaError] = useState('');
  const localVideoRef = useRef(null);
  const socket = useSocket(SOCKET_BASE);

  const sessionHostId = activeSession?.host;
  const isHostSession = profile?._id && sessionHostId === profile._id;
  const canGoLive = profile?.role === 'admin' || (profile?.followerCount || 0) >= 1000;

  useEffect(() => {
    authService.me().then((response) => setProfile(response.data)).catch(() => {
      localStorage.removeItem('youtogram_token');
      router.replace('/');
    });

    fetchSessions();
  }, [router]);

  useEffect(() => {
    if (!profile || mediaStream) return;
    requestMediaAccess();
  }, [profile, mediaStream]);

  useEffect(() => {
    if (!mediaStream || !localVideoRef.current) return;

    localVideoRef.current.srcObject = mediaStream;
    localVideoRef.current.play().catch(() => {});

    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      releaseMedia();
    };
  }, []);

  useEffect(() => {
    if (!socket || !activeSession || !profile) return;

    socket.emit('joinLive', { sessionId: activeSession.id, userId: profile._id, senderName: profile.username });

    const handleViewerUpdate = (payload) => {
      if (payload.sessionId !== activeSession.id) return;
      setViewers(payload.viewers || 0);
    };

    const handleLiveMessage = (payload) => {
      if (payload.sessionId !== activeSession.id) return;
      setMessages((current) => [...current, payload]);
    };

    const handleLiveGift = (payload) => {
      if (payload.sessionId !== activeSession.id) return;
      setGiftEvents((current) => [payload, ...current].slice(0, 8));
      setStatusText(`${payload.senderName} sent ${payload.label}!`);
      if (payload.senderId === profile._id) {
        setProfile((current) => ({ ...current, points: Math.max(0, (current?.points || 0) - payload.amount) }));
      }
      window.setTimeout(() => setStatusText(''), 2800);
    };

    const handleSocketError = (payload) => {
      setSocketError(payload?.message || 'Live socket error occurred');
      window.setTimeout(() => setSocketError(''), 3000);
    };

    socket.on('viewer:update', handleViewerUpdate);
    socket.on('liveMessage', handleLiveMessage);
    socket.on('liveGift', handleLiveGift);
    socket.on('error', handleSocketError);

    return () => {
      socket.emit('leaveLive', { sessionId: activeSession.id, userId: profile._id });
      socket.off('viewer:update', handleViewerUpdate);
      socket.off('liveMessage', handleLiveMessage);
      socket.off('liveGift', handleLiveGift);
      socket.off('error', handleSocketError);
    };
  }, [socket, activeSession, profile]);

  const fetchSessions = async () => {
    try {
      const response = await liveService.listSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Unable to load live sessions', error);
    }
  };

  const handleStartLive = async () => {
    if (!title.trim()) {
      setStatusText('Please add a title for your live session.');
      return;
    }

    if (!canGoLive) {
      setStatusText('You need at least 1,000 followers to go live. Keep building your audience.');
      return;
    }

    try {
      const response = await liveService.createSession({ title, description });
      setActiveSession(response.data);
      setIsHosting(true);
      setViewers(0);
      setMessages([]);
      setGiftEvents([]);
      setSessions((current) => [response.data, ...current]);
      setStatusText('You are live! Viewers can join and send gifts.');
    } catch (error) {
      setStatusText(error.message || 'Could not start live session.');
    }
  };

  const requestMediaAccess = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('Media devices are not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      setCameraOn(true);
      setMicOn(true);
      setMediaError('');
    } catch (error) {
      setMediaError(error.message || 'Unable to access camera or microphone.');
    }
  };

  const releaseMedia = () => {
    if (!mediaStream) return;
    mediaStream.getTracks().forEach((track) => track.stop());
    setMediaStream(null);
  };

  const handleWatchSession = async (session) => {
    try {
      const response = await liveService.joinSession(session.id);
      setActiveSession(session);
      setViewers(response.data.viewers || 0);
      setIsHosting(false);
      setMessages([]);
      setGiftEvents([]);
      setStatusText(`Watching ${session.title}`);
    } catch (error) {
      setStatusText(error.message || 'Unable to join live session.');
    }
  };

  const toggleCamera = () => {
    if (!mediaStream) return;
    const videoTrack = mediaStream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  };

  const toggleMic = () => {
    if (!mediaStream) return;
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  const handleSendGift = (gift) => {
    if (!socket || !activeSession || !profile) return;
    if ((profile.points || 0) < gift.cost) {
      setStatusText('Not enough points for that gift. Earn more before sending.');
      return;
    }

    socket.emit('sendGift', {
      sessionId: activeSession.id,
      userId: profile._id,
      senderName: profile.username,
      giftType: gift.id,
      label: gift.label,
      amount: gift.cost
    });
  };

  const handleSendMessage = () => {
    if (!messageDraft.trim() || !socket || !activeSession || !profile) return;

    socket.emit('liveMessage', {
      sessionId: activeSession.id,
      userId: profile._id,
      senderName: profile.username,
      message: messageDraft.trim(),
      createdAt: new Date().toISOString()
    });
    setMessageDraft('');
  };

  return (
    <main className="livePage">
      <section className="liveSidebar">
        <div className="liveSection">
          <h2>Live rooms</h2>
          <p>Start a live room or tap any active session to watch and send gifts.</p>
          <div className="liveSessionList">
            {sessions.length ? sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className="liveSessionCard"
                onClick={() => handleWatchSession(session)}
              >
                <div>
                  <strong>{session.title}</strong>
                  <p>{session.description}</p>
                </div>
                <span>{session.viewers || 0} viewers</span>
              </button>
            )) : (
              <p>No active live sessions right now.</p>
            )}
          </div>
          {profile ? (
            <div className="liveProfileSummary">
              <p><strong>{profile.username}</strong></p>
              <p>Points: {profile.points ?? 0}</p>
              <p>Followers: {profile.followerCount ?? 0}</p>
              <p>{canGoLive ? 'Ready to go live' : '1,000 followers required to go live'}</p>
            </div>
          ) : null}
        </div>

        <div className="liveSection">
          <h2>Go live</h2>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Live title" />
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description for viewers" rows={3} />
          <button type="button" className="submitButton" onClick={requestMediaAccess}>
            Enable camera & mic
          </button>
          <div className="liveMediaControls">
            <button type="button" className="submitButton" onClick={toggleCamera} disabled={!mediaStream}>
              {cameraOn ? 'Turn video off' : 'Turn video on'}
            </button>
            <button type="button" className="submitButton" onClick={toggleMic} disabled={!mediaStream}>
              {micOn ? 'Mute mic' : 'Unmute mic'}
            </button>
            <button type="button" className="submitButton" onClick={handleStartLive} disabled={!mediaStream}>
              {isHosting ? 'You are live' : 'Start live'}
            </button>
          </div>
          {mediaError ? <p className="liveErrorBanner">{mediaError}</p> : null}
        </div>
      </section>

      <section className="liveStage">
        {activeSession ? (
          <>
            <div className="liveHeader">
              <div>
                <p className="liveStatus">LIVE</p>
                <h1>{activeSession.title}</h1>
                <p>{activeSession.description}</p>
              </div>
              <div className="liveBadge">{viewers} viewers</div>
            </div>

            <div className="liveBroadcastShell">
              <div className="liveBroadcastPlaceholder">
                <div className="liveHostInfo">
                  <strong>{isHostSession ? 'You are streaming' : `${activeSession.hostName || 'Host'} is live`}</strong>
                  <small>Real-time broadcast area</small>
                </div>
                {mediaStream ? (
                  <div className="liveVideoPreview">
                    <video ref={localVideoRef} className="livePreviewVideo" muted playsInline />
                    <div className="livePreviewStatus">
                      <span>{cameraOn ? 'Video enabled' : 'Video off'}</span>
                      <span>{micOn ? 'Mic enabled' : 'Mic muted'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="liveStreamVisual">📺</div>
                )}
              </div>
              <div className="liveOverlayBar">
                {statusText && <p className="liveStatusText">{statusText}</p>}
                {socketError && <p className="liveErrorBanner">{socketError}</p>}
                <div className="liveGiftFeed">
                  {giftEvents.map((gift, index) => (
                    <span key={`${gift.sessionId}-${index}`} className="liveGiftToast">
                      {gift.senderName} sent {gift.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="liveInteractionPanel">
              <div className="liveGiftButtons">
                {GIFTS.map((gift) => {
                  const cannotAfford = (profile?.points || 0) < gift.cost;
                  return (
                    <button
                      key={gift.id}
                      type="button"
                      className="liveGiftButton"
                      disabled={cannotAfford}
                      onClick={() => handleSendGift(gift)}
                      title={cannotAfford ? 'Not enough points' : `Spend ${gift.cost} points`}
                    >
                      {gift.label}
                    </button>
                  );
                })}
              </div>

              <div className="liveChatPanel">
                <div className="liveChatMessages">
                  {messages.length ? messages.map((message, index) => (
                    <div key={`${message.userId}-${index}`} className="liveChatMessage">
                      <strong>{message.senderName}</strong>
                      <span>{message.message}</span>
                    </div>
                  )) : (
                    <p className="livePlaceholderText">Chat while you watch. Gift messages appear here.</p>
                  )}
                </div>
                <div className="liveChatInputRow">
                  <input
                    type="text"
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder="Write a message"
                  />
                  <button type="button" className="submitButton" onClick={handleSendMessage}>Send</button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="liveEmptyState">
            <h2>No live session selected</h2>
            <p>Pick one from the list or start your own live room to begin streaming in-app.</p>
          </div>
        )}
      </section>
    </main>
  );
}
