import { useState } from 'react';

function getInitials(name = 'Youtogram User') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'Y'
  );
}

function formatCompactNumber(value = 0) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  }

  return `${value}`;
}

export default function PostCard({ post, currentUserId, onToggleLike, onAddComment, onShare, highlighted = false }) {
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const authorName = post?.author?.username || 'Youtogram User';
  const avatar = post?.author?.avatar;
  const firstMedia = post?.media?.[0];
  const likedByCurrentUser = Array.isArray(post?.likes) && post.likes.some((like) => String(like) === String(currentUserId));
  const likeCount = post?.likes?.length || 0;
  const commentCount = post?.comments?.length || 0;
  const recentComments = Array.isArray(post?.comments) ? post.comments.slice(-3) : [];
  const postedAt = post?.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now';

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    setSubmittingComment(true);
    try {
      await onAddComment?.(post._id, text);
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <article id={`feed-post-${post._id}`} className={`facebookPostCard socialPostCard ${highlighted ? 'facebookPostCardHighlighted' : ''}`}>
      <header className="facebookPostHeader">
        <div className="facebookPostAuthor">
          {avatar ? (
            <img src={avatar} alt={`${authorName} avatar`} className="facebookPostAvatar" />
          ) : (
            <div className="facebookPostAvatar facebookPostAvatarFallback">{getInitials(authorName)}</div>
          )}
          <div className="facebookPostMeta">
            <strong>{authorName}</strong>
            <span>{postedAt}</span>
          </div>
        </div>
        <button type="button" className="facebookPostMenu" aria-label="Copy post link" onClick={() => onShare?.(post._id)}>
          ...
        </button>
      </header>

      {post?.text ? <p className="facebookPostText">{post.text}</p> : null}

      {firstMedia?.url ? (
        <div className="facebookPostMediaFrame">
          {firstMedia.type === 'video' ? (
            <video src={firstMedia.url} className="facebookPostMedia" controls playsInline />
          ) : (
            <img src={firstMedia.url} alt="Post media" className="facebookPostMedia" />
          )}
        </div>
      ) : null}

      <div className="facebookPostStats">
        <div className="facebookReactionSummary">
          <span className="facebookReactionBadge">Like</span>
          <span>{formatCompactNumber(likeCount)}</span>
        </div>
        <span>{formatCompactNumber(commentCount)} comment{commentCount === 1 ? '' : 's'}</span>
      </div>

      <aside className="facebookPostActions">
        <button type="button" className={`facebookActionButton ${likedByCurrentUser ? 'facebookActionButtonActive' : ''}`} onClick={() => onToggleLike?.(post._id)}>
          Like
        </button>
        <button type="button" className="facebookActionButton" onClick={() => document.getElementById(`comment-${post._id}`)?.focus()}>
          Comment
        </button>
        <button type="button" className="facebookActionButton" onClick={() => onShare?.(post._id)}>
          Share
        </button>
      </aside>

      <section className="facebookCommentsPanel">
        {recentComments.length ? (
          <div className="facebookCommentsList">
            {recentComments.map((comment, index) => {
              const commentAuthor = comment.author?.username || 'User';

              return (
                <div key={comment._id || `${post._id}-comment-${index}`} className="facebookCommentItem">
                  <strong>{commentAuthor}</strong>
                  <span>{comment.text}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="facebookNoComments">No comments yet. Be the first to say something.</p>
        )}

        <form className="facebookCommentForm" onSubmit={handleCommentSubmit}>
          <input
            id={`comment-${post._id}`}
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Write a comment..."
            aria-label="Write a comment"
          />
          <button type="submit" disabled={submittingComment || !commentText.trim()}>
            {submittingComment ? 'Posting...' : 'Comment'}
          </button>
        </form>
      </section>
    </article>
  );
}
