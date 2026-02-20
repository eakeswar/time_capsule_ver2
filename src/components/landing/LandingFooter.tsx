import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-secondary/30 py-12">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="text-xl font-medium flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TimeCapsule
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">Schedule files to be sent at the perfect time.</p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
            <Link to="/" className="text-sm hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/auth" className="text-sm hover:text-primary transition-colors">
              Sign Up
            </Link>
            <Link to="/auth" className="text-sm hover:text-primary transition-colors">
              Login
            </Link>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Privacy
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TimeCapsule. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
