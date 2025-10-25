-- Add metadata fields to shopping_list table for enhanced cart functionality
ALTER TABLE public.shopping_list
ADD COLUMN item_type text DEFAULT 'Pantry',
ADD COLUMN expiration_date date,
ADD COLUMN is_cold boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.shopping_list.item_type IS 'Category of the item (Pantry, Produce, Dairy, etc.)';
COMMENT ON COLUMN public.shopping_list.expiration_date IS 'Expected expiration date for the item';
COMMENT ON COLUMN public.shopping_list.is_cold IS 'Whether the item requires refrigeration';