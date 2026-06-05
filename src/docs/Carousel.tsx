import { useState, useEffect } from "react";

type CarouselProps = {
  slides: Array<{ src: string; alt: string }>;
  caption?: string;
  interval?: number;
};

export function Carousel({ slides, caption, interval = 1000 }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length, interval]);

  if (slides.length === 0) return null;

  return (
    <figure style={{ position: "relative", margin: "2rem 0" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        {slides.map((slide, idx) => (
          <img
            key={idx}
            src={slide.src}
            alt={slide.alt}
            loading="lazy"
            style={{
              width: "100%",
              height: "auto",
              display: idx === current ? "block" : "none",
              opacity: idx === current ? 1 : 0,
              transition: "opacity 200ms ease-in-out",
            }}
          />
        ))}
      </div>

      {slides.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                backgroundColor: idx === current ? "#333" : "#ccc",
                transition: "background-color 200ms",
              }}
              aria-label={`Diapositiva ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
