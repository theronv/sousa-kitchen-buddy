// src/types/recipe.ts
export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: string;
  cuisine?: string;
  created_at?: string;
  user_id?: string;
}
