export default function VideoPlayer({ src }) {
  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
      <video
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        src={src}
        controls
        muted
      />
    </div>
  );
}
