import templeImage from "@/assets/luxor-temple.jpg";
import cruiseImage from "@/assets/aswan-sunset.jpg";
import balloonsImage from "@/assets/balloons-luxor.jpg";
import nubianImage from "@/assets/nubian-village.jpg";

const attractions = [
  {
    title: "Ancient Temples",
    description: "Marvel at the timeless ancient wonders of Luxor and Aswan.",
    image: templeImage,
    highlights: ["3000+ years old", "UNESCO Sites", "Expert guides"],
  },
  {
    title: "Nile River Cruises",
    description: "Luxurious journey in Luxor and Aswan on the world's longest river",
    image: cruiseImage,
    highlights: ["5-star ships", "All inclusive", "Scenic views"],
  },
  {
    title: "Hot Air Balloon Rides",
    description: "Witness breathtaking sunrise views over the Valley of the Kings",
    image: balloonsImage,
    highlights: ["Sunrise flights", "Safe & certified", "Photo opportunities"],
  },
  {
    title: "Cultural Sites",
    description: "Experience vibrant Nubian villages and traditional Egyptian culture",
    image: nubianImage,
    highlights: ["Local cuisine", "Handicrafts", "Cultural shows"],
  },
];

const AttractionsSection = () => {
  return (
    <section id="destinations" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Top <span className="text-primary">Attractions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the most iconic landmarks and experiences in Luxor & Aswan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {attractions.map((attraction, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative h-96 overflow-hidden">
                <img
                  src={attraction.image}
                  alt={attraction.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-3xl font-bold mb-3">{attraction.title}</h3>
                <p className="text-white/90 mb-4 text-lg">
                  {attraction.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {attraction.highlights.map((highlight, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm border border-white/30"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
                {/* <Button variant="secondary" className="group-hover:bg-secondary group-hover:text-secondary-foreground">
                  Learn More
                </Button> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AttractionsSection;
