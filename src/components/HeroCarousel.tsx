import heroImage from "@/assets/hero-plant.jpg";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HeroCarousel = () => {
  return (
    <div className="relative rounded-lg overflow-hidden h-full">
      <img
        src={heroImage}
        alt="Industrial facility"
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button className="w-7 h-7 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? "bg-primary" : "bg-card/60"}`}
            />
          ))}
        </div>
        <button className="w-7 h-7 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors">
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;
