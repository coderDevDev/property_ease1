-- Add property_code column
ALTER TABLE properties 
ADD COLUMN property_code VARCHAR(20) UNIQUE;

-- Create sequence for property numbering
CREATE SEQUENCE IF NOT EXISTS property_code_seq START 1;

-- Create function to generate property code
CREATE OR REPLACE FUNCTION generate_property_code()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_code TEXT;
BEGIN
  -- Get next sequence number
  next_num := nextval('property_code_seq');
  
  -- Format as P-001, P-002, etc.
  new_code := 'P-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate property code on insert
CREATE OR REPLACE FUNCTION set_property_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.property_code IS NULL THEN
    NEW.property_code := generate_property_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_property_code
BEFORE INSERT ON properties
FOR EACH ROW
EXECUTE FUNCTION set_property_code();

-- Backfill existing properties with codes
DO $$
DECLARE
  prop RECORD;
BEGIN
  FOR prop IN SELECT id FROM properties WHERE property_code IS NULL ORDER BY created_at
  LOOP
    UPDATE properties 
    SET property_code = generate_property_code() 
    WHERE id = prop.id;
  END LOOP;
END $$;