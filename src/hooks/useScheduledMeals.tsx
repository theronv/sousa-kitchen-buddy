import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduledMeal {
  id: string;
  user_id: string;
  recipe_id?: string;
  meal_title: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useScheduledMeals = (startDate?: Date, endDate?: Date) => {
  const queryClient = useQueryClient();

  const { data: meals, isLoading } = useQuery({
    queryKey: ["scheduled-meals", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("scheduled_meals")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (startDate) {
        query = query.gte("scheduled_date", startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        query = query.lte("scheduled_date", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ScheduledMeal[];
    },
  });

  const addMeal = useMutation({
    mutationFn: async (meal: Omit<ScheduledMeal, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("scheduled_meals")
        .insert([{ ...meal, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-meals"] });
      toast.success("Meal added to calendar");
    },
    onError: (error) => {
      toast.error("Failed to add meal: " + error.message);
    },
  });

  const updateMeal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ScheduledMeal> & { id: string }) => {
      const { data, error } = await supabase
        .from("scheduled_meals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-meals"] });
      toast.success("Meal updated");
    },
    onError: (error) => {
      toast.error("Failed to update meal: " + error.message);
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_meals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-meals"] });
      toast.success("Meal removed");
    },
    onError: (error) => {
      toast.error("Failed to remove meal: " + error.message);
    },
  });

  return {
    meals: meals || [],
    isLoading,
    addMeal: addMeal.mutate,
    updateMeal: updateMeal.mutate,
    deleteMeal: deleteMeal.mutate,
  };
};
