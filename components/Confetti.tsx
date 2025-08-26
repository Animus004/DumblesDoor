import React from 'react';

const Confetti: React.FC = () => {
  const confettiCount = 150;
  const confettiPieces = Array.from({ length: confettiCount }).map((_, i) => {
    const colors = ['#4FD1C5', '#F687B3', '#FF8A65', '#A78BFA', '#E9D5FF', '#facc15'];
    const style: React.CSSProperties = {
      left: `${Math.random() * 100}vw`,
      width: `${Math.random() * 8 + 4}px`,
      height: `${Math.random() * 8 + 4}px`,
      animationDelay: `${Math.random() * 2}s`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      transform: `rotate(${Math.random() * 360}deg)`,
    };
    return <div key={i} className="confetti" style={style}></div>;
  });

  return <div className="confetti-container" aria-hidden="true">{confettiPieces}</div>;
};

export default Confetti;
