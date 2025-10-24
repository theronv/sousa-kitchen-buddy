import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const pantryItems = [
  { name: "Olive Oil", category: "Pantry", status: "good" },
  { name: "Pasta", category: "Pantry", status: "low" },
  { name: "Tomatoes", category: "Produce", status: "expiring" },
  { name: "Milk", category: "Dairy", status: "good" },
];

const Pantry = () => {
  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pantry</h1>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {/* Alert for low items */}
        <Card className="p-4 bg-accent/10 border-accent/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Items need attention</p>
              <p className="text-sm text-muted-foreground">2 items are running low or expiring soon</p>
            </div>
          </div>
        </Card>

        {/* Pantry items grouped */}
        <div className="space-y-4">
          {["Produce", "Dairy", "Pantry"].map((category) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h2>
              <div className="space-y-2">
                {pantryItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <Card key={item.name} className="p-3 shadow-card">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{item.name}</span>
                        {item.status !== "good" && (
                          <Badge
                            variant={item.status === "low" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {item.status === "low" ? "Low" : "Expiring"}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Pantry;
