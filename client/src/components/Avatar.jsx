// Deterministic color per username
const hue = (name) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);

export default function Avatar({ name, online }) {
  return (
    <div className="avatar" style={{ background: `hsl(${hue(name)} 55% 50%)` }}>
      {name[0]?.toUpperCase()}
      {online !== undefined && <span className={`dot ${online ? 'on' : ''}`} />}
    </div>
  );
}
