-- Create shopping_list table
CREATE TABLE public.shopping_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient TEXT NOT NULL,
  purchased BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_list
CREATE POLICY "Users can view their own shopping list" 
ON public.shopping_list 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping list items" 
ON public.shopping_list 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping list items" 
ON public.shopping_list 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping list items" 
ON public.shopping_list 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create pantry table
CREATE TABLE public.pantry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Pantry',
  status TEXT NOT NULL DEFAULT 'Fresh',
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pantry ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pantry
CREATE POLICY "Users can view their own pantry items" 
ON public.pantry 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pantry items" 
ON public.pantry 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry items" 
ON public.pantry 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pantry items" 
ON public.pantry 
FOR DELETE 
USING (auth.uid() = user_id);