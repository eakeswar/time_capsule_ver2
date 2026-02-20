import { Calendar, Clock, Mail } from "lucide-react";

type Props = {
  sectionRef?: React.RefObject<HTMLElement>;
};

export default function HowItWorksSection({ sectionRef }: Props) {
  return (
    <section ref={sectionRef} className="section bg-secondary/50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple, intuitive, and powerful. Schedule your files in three easy steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div
            className="bg-background rounded-2xl p-6 shadow-sm border border-border scale-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
            <p className="text-muted-foreground">Securely upload any file type that you need to send later.</p>
          </div>

          <div
            className="bg-background rounded-2xl p-6 shadow-sm border border-border scale-in"
            style={{ animationDelay: "400ms" }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Schedule Delivery</h3>
            <p className="text-muted-foreground">Set the exact time and date when your files should be sent.</p>
          </div>

          <div
            className="bg-background rounded-2xl p-6 shadow-sm border border-border scale-in"
            style={{ animationDelay: "600ms" }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Automatic Delivery</h3>
            <p className="text-muted-foreground">Recipients get your files via email exactly when scheduled.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
