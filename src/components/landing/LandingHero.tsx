import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Props = {
  onLearnMore: () => void;
};

export default function LandingHero({ onLearnMore }: Props) {
  return (
    <section className="pt-32 pb-20 md:pt-44 md:pb-32">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-block px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium slide-down"
            style={{ animationDelay: "200ms" }}
          >
            Introducing TimeCapsule
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance slide-down"
            style={{ animationDelay: "400ms" }}
          >
            Schedule files to be sent <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              exactly when needed
            </span>
          </h1>
          <p
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto slide-down"
            style={{ animationDelay: "600ms" }}
          >
            TimeCapsule lets you upload and schedule files to be delivered via email at precisely the right moment.
          </p>
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-down"
            style={{ animationDelay: "800ms" }}
          >
            <Link to="/auth">
              <Button className="hero-button bg-primary hover:bg-primary/90 w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Button
              variant="outline"
              className="hero-button w-full sm:w-auto"
              onClick={onLearnMore}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
