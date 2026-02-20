import { Link } from "react-router-dom";
import { Filter, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BenefitsSection() {
  return (
    <section className="section">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose TimeCapsule?</h2>
            <p className="text-muted-foreground mb-8">
              TimeCapsule combines simplicity with powerful features to give you complete control over your file deliveries.
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-3 rounded-full p-1 bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Secure File Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Files are encrypted and stored securely until delivery time.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-3 rounded-full p-1 bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Customizable Options</h3>
                  <p className="text-sm text-muted-foreground">Personalize delivery settings and email templates.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-3 rounded-full p-1 bg-primary/10">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Advanced Filtering</h3>
                  <p className="text-sm text-muted-foreground">Easily manage and filter your scheduled files.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90">Start Scheduling</Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="glass-card rounded-2xl shadow-lg p-6 md:p-8 max-w-md mx-auto bg-card text-card-foreground dark:bg-gray-800/80">
              <div className="absolute -top-4 -right-4 bg-primary text-white text-xs px-3 py-1 rounded-full">
                Dashboard Preview
              </div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Upcoming Deliveries</h3>
                <Button variant="ghost" size="sm" className="h-8">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-secondary/30 dark:bg-gray-700/50 p-3 shadow-sm border border-border"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Project Proposal.pdf</p>
                        <p className="text-xs text-muted-foreground">To: client@example.com</p>
                      </div>
                      <div className="rounded-full bg-gray-200 dark:bg-gray-600 py-1 px-2 text-xs">
                        Tomorrow
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${90 - item * 30}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -z-10 -bottom-6 -right-6 h-64 w-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
            <div className="absolute -z-10 -top-6 -left-6 h-48 w-48 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
