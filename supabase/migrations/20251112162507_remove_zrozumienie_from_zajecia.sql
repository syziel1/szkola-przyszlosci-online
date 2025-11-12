/*
  # Remove zrozumienie column from zajecia table

  1. Changes
    - Drop the 'zrozumienie' column from the 'zajecia' table
    - This column stored understanding level ratings (1-5) for each class session
  
  2. Notes
    - This is a safe operation as we're removing an optional field
    - No data migration needed as the column is being completely removed
    - Related UI components and forms will be updated separately
*/

-- Drop the zrozumienie column from zajecia table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zajecia' AND column_name = 'zrozumienie'
  ) THEN
    ALTER TABLE zajecia DROP COLUMN zrozumienie;
  END IF;
END $$;