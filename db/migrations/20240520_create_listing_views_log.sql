-- Crear tabla para registrar vistas de listados
CREATE TABLE IF NOT EXISTS listing_views_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT, -- Para usuarios no autenticados
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para consultas frecuentes
  INDEX idx_views_listing_id (listing_id),
  INDEX idx_views_user_id (user_id),
  INDEX idx_views_created_at (created_at)
);

-- Función para registrar una vista de listado
CREATE OR REPLACE FUNCTION log_listing_view(
  p_listing_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_view UUID;
  v_new_view_id UUID;
BEGIN
  -- Si el usuario está autenticado, verificar si ya vio este listado en las últimas 24 horas
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_existing_view
    FROM listing_views_log
    WHERE listing_id = p_listing_id
      AND user_id = p_user_id
      AND created_at > NOW() - INTERVAL '24 hours'
    LIMIT 1;
    
    -- Si ya lo vio, no registrar otra vez
    IF v_existing_view IS NOT NULL THEN
      RETURN v_existing_view;
    END IF;
  -- Si no está autenticado, verificar por IP si está disponible
  ELSIF p_ip_address IS NOT NULL THEN
    SELECT id INTO v_existing_view
    FROM listing_views_log
    WHERE listing_id = p_listing_id
      AND ip_address = p_ip_address
      AND created_at > NOW() - INTERVAL '24 hours'
    LIMIT 1;
    
    -- Si ya lo vio, no registrar otra vez
    IF v_existing_view IS NOT NULL THEN
      RETURN v_existing_view;
    END IF;
  END IF;
  
  -- Insertar nueva vista
  INSERT INTO listing_views_log(listing_id, user_id, ip_address, user_agent, referrer)
  VALUES (p_listing_id, p_user_id, p_ip_address, p_user_agent, p_referrer)
  RETURNING id INTO v_new_view_id;
  
  -- Incrementar contador en la tabla de listados
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id;
  
  RETURN v_new_view_id;
END;
$$; 