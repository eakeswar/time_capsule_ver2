import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LandingCTA() {
  return (
    <section className="section bg-primary/5">
      <div className="container-custom text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of users who trust TimeCapsule for their scheduled file delivery needs.
        </p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg shadow-md">
            Create Your Account
          </Button>
        </Link>
      </div>
    </section>
  );
}
