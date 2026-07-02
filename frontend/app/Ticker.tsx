const trendTopics = [
  { name: "Cheap camera setups", score: 88, tier: "hi" },
  { name: "Why my last video flopped", score: 65, tier: "mid" },
  { name: "Niche down or go broad", score: 82, tier: "hi" },
  { name: "Editing apps compared", score: 71, tier: "mid" },
  { name: "Day in my life as a creator", score: 85, tier: "hi" },
  { name: "Underrated travel spots 2026", score: 69, tier: "mid" },
];

export default function Ticker() {
  const items = [...trendTopics, ...trendTopics];
  return (
    <div className="ticker-section">
      <div className="ticker-track">
        {items.map((t, i) => (
          <span className="tick" key={i}>
            {t.name} <span className={`sc ${t.tier}`}>{t.score}</span>
          </span>
        ))}
      </div>
    </div>
  );
}