-- Create car_reservations table
CREATE TABLE car_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reservation_amount DECIMAL NOT NULL,
  payment_id VARCHAR NOT NULL,
  payment_status VARCHAR NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE car_reservations ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de reservas
CREATE POLICY "Reservations are viewable by everyone" ON car_reservations
  FOR SELECT USING (true);

-- Permitir a los usuarios crear sus propias reservas
CREATE POLICY "Users can create their own reservations" ON car_reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
-- Los usuarios solo pueden actualizar sus propias reservas
CREATE POLICY "Users can update their own reservations" ON car_reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propias reservas
CREATE POLICY "Users can delete their own reservations" ON car_reservations
  FOR DELETE USING (auth.uid() = user_id);

-- Crear índices para un mejor rendimiento
CREATE INDEX car_reservations_listing_id_idx ON car_reservations(listing_id);
CREATE INDEX car_reservations_user_id_idx ON car_reservations(user_id);
CREATE INDEX car_reservations_payment_status_idx ON car_reservations(payment_status);
CREATE INDEX car_reservations_expires_at_idx ON car_reservations(expires_at);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_car_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada UPDATE
CREATE TRIGGER update_car_reservation_updated_at
BEFORE UPDATE ON car_reservations
FOR EACH ROW
EXECUTE FUNCTION update_car_reservation_updated_at(); 