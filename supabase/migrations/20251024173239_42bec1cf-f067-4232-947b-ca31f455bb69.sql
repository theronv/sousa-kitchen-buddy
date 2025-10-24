-- Create scheduled_meals table for calendar integration
CREATE TABLE public.scheduled_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  meal_title TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_meals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled meals"
ON public.scheduled_meals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled meals"
ON public.scheduled_meals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled meals"
ON public.scheduled_meals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled meals"
ON public.scheduled_meals
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_meals_updated_at
BEFORE UPDATE ON public.scheduled_meals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_scheduled_meals_user_date ON public.scheduled_meals(user_id, scheduled_date);