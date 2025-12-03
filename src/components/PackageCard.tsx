import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Check } from "lucide-react";
import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";

export interface Package {
  id: string;
  title: string;
  destination: string;
  duration: string;
  travelers: string;
  image: string;
  itinerary: { day: string; activities: string }[];
  inclusions: string[];
  price?: string;
}

interface PackageCardProps {
  package: Package;
}

export const PackageCard = ({ package: pkg }: PackageCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card className="overflow-hidden transition-smooth hover:shadow-luxury hover:-translate-y-2 group">
      <div className="relative h-64 overflow-hidden">
        <img
          src={pkg.image}
          alt={pkg.title}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent opacity-60 group-hover:opacity-40 transition-smooth" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white mb-2">{pkg.title}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-secondary text-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              {pkg.destination}
            </Badge>
          </div>
        </div>
      </div>

      <CardHeader className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{pkg.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">{pkg.travelers}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-lg mb-3 text-primary">Daily Itinerary</h4>
          <div className="space-y-2">
            {pkg.itinerary.map((day, idx) => (
              <div key={idx} className="pl-4 border-l-2 border-primary/30">
                <p className="font-medium text-sm text-foreground">{day.day}</p>
                <p className="text-sm text-muted-foreground">{day.activities}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-3 text-primary">What's Included</h4>
          <div className="grid grid-cols-1 gap-2">
            {pkg.inclusions.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {pkg.price && (
          <div className="w-full text-center py-2">
            <span className="text-2xl font-bold text-primary">{pkg.price}</span>
            <span className="text-sm text-muted-foreground"> per person</span>
          </div>
        )}
        <RequireAuth>
          <Button className="w-full gradient-luxury hover:shadow-gold transition-smooth text-white" size="lg">
            Book Now
          </Button>
        </RequireAuth>
      </CardFooter>
    </Card>
  );
};
