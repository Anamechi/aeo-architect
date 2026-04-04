import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export const BottomCTASection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <Card className="border-border bg-card">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
              Already Know You Want AEO? Let's Build Your Strategy.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              For business owners who are ready to move from invisible to
              AI-citable — schedule a Strategy Session and we'll build your
              custom AEO roadmap in 60 minutes.
            </p>
            {/* PLACEHOLDER: Calendar booking URL for Strategy Session */}
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold">
              <Link to="/contact">
                Schedule a Strategy Session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Not sure yet?{" "}
              <a href="#citation-audit" className="text-primary hover:underline">
                Start with the Free Citation Audit above
              </a>{" "}
              — no commitment required.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
