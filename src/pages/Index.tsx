import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChefHat, Calendar, Package, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-meal-planning.jpg";

const Index = () => {
  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={heroImage}
            alt="Fresh ingredients"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">Welcome to Sousa</h1>
            <p className="text-sm text-muted-foreground">Your personal meal planning assistant</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 shadow-card hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Plan Week</h3>
                  <p className="text-xs text-muted-foreground">Generate meals</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Ask Sousa</h3>
                  <p className="text-xs text-muted-foreground">AI recipes</p>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Feature Highlight */}
          <Card className="p-5 shadow-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-semibold text-foreground mb-1">Smart Planning</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Let AI create personalized meal plans based on your preferences and what's in your pantry
                </p>
                <Button size="sm" className="w-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </Button>
              </div>
            </div>
          </Card>

          {/* Status Cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Quick Overview</h2>
            
            <Card className="p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Pantry Status</p>
                    <p className="text-xs text-muted-foreground">12 items tracked</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">This Week</p>
                    <p className="text-xs text-muted-foreground">5 meals planned</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;
