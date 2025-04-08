-- Función para obtener estadísticas de un vendedor en un período específico
CREATE OR REPLACE FUNCTION get_seller_statistics(
  p_seller_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) 
RETURNS TABLE (
  active_listings BIGINT,
  total_listings BIGINT,
  total_views BIGINT,
  average_views_per_listing NUMERIC,
  total_contacts BIGINT,
  conversion_rate NUMERIC,
  total_reservations BIGINT,
  reserved_listings BIGINT,
  reservation_rate NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH 
    -- Publicaciones activas
    seller_listings AS (
      SELECT 
        id,
        view_count,
        contact_count,
        status,
        created_at
      FROM 
        listings
      WHERE 
        user_id = p_seller_id
        AND created_at >= p_start_date
        AND created_at <= p_end_date
    ),
    -- Reservas en el período
    reservations AS (
      SELECT 
        cr.id,
        cr.listing_id,
        cr.payment_status,
        cr.created_at
      FROM 
        car_reservations cr
      JOIN 
        listings l ON cr.listing_id = l.id
      WHERE 
        l.user_id = p_seller_id
        AND cr.created_at >= p_start_date
        AND cr.created_at <= p_end_date
    )
  SELECT
    -- Publicaciones activas
    COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('active', 'approved')),
    
    -- Total de publicaciones
    COUNT(DISTINCT l.id),
    
    -- Total de vistas
    COALESCE(SUM(l.view_count), 0),
    
    -- Promedio de vistas por publicación
    CASE 
      WHEN COUNT(l.id) > 0 THEN COALESCE(SUM(l.view_count), 0)::NUMERIC / COUNT(l.id)
      ELSE 0
    END,
    
    -- Total de contactos
    COALESCE(SUM(l.contact_count), 0),
    
    -- Tasa de conversión (vistas a contactos)
    CASE 
      WHEN SUM(l.view_count) > 0 THEN (SUM(l.contact_count)::NUMERIC / SUM(l.view_count)) * 100
      ELSE 0
    END,
    
    -- Total de reservas
    COUNT(DISTINCT r.id),
    
    -- Publicaciones actualmente reservadas
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'reserved'),
    
    -- Tasa de reserva (contactos a reservas)
    CASE 
      WHEN SUM(l.contact_count) > 0 THEN (COUNT(DISTINCT r.id)::NUMERIC / SUM(l.contact_count)) * 100
      ELSE 0
    END
  FROM 
    seller_listings l
  LEFT JOIN 
    reservations r ON l.id = r.listing_id;
END;
$$;

-- Función para obtener métricas de rendimiento de un vendedor
CREATE OR REPLACE FUNCTION get_seller_performance_metrics(
  p_seller_id UUID
) 
RETURNS TABLE (
  avg_views_to_contact NUMERIC,
  avg_contacts_to_reservation NUMERIC,
  listing_completion_score NUMERIC,
  photo_quality_score NUMERIC,
  response_time_avg NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH 
    -- Publicaciones del vendedor
    seller_listings AS (
      SELECT 
        id,
        view_count,
        contact_count,
        CASE WHEN description IS NULL THEN 0 ELSE LENGTH(description) END AS desc_length,
        CASE WHEN images IS NULL THEN 0 ELSE ARRAY_LENGTH(images, 1) END AS img_count,
        status
      FROM 
        listings
      WHERE 
        user_id = p_seller_id
    ),
    -- Mensajes recibidos por el vendedor
    seller_messages AS (
      SELECT 
        m.id,
        m.created_at,
        mr.created_at AS response_at
      FROM 
        messages m
      LEFT JOIN 
        messages mr ON m.thread_id = mr.thread_id AND mr.user_id = p_seller_id
      WHERE 
        m.recipient_id = p_seller_id
    )
  SELECT
    -- Promedio de vistas para obtener un contacto
    CASE 
      WHEN SUM(sl.contact_count) > 0 THEN SUM(sl.view_count)::NUMERIC / SUM(sl.contact_count)
      ELSE 0
    END,
    
    -- Promedio de contactos para obtener una reserva
    CASE 
      WHEN (
        SELECT COUNT(*) 
        FROM car_reservations cr 
        JOIN listings l ON cr.listing_id = l.id 
        WHERE l.user_id = p_seller_id
      ) > 0 
      THEN SUM(sl.contact_count)::NUMERIC / (
        SELECT COUNT(*) 
        FROM car_reservations cr 
        JOIN listings l ON cr.listing_id = l.id 
        WHERE l.user_id = p_seller_id
      )
      ELSE 0
    END,
    
    -- Puntuación de completitud de las publicaciones (0-100)
    CASE 
      WHEN COUNT(*) > 0 THEN (
        AVG(
          CASE 
            WHEN desc_length > 300 THEN 100 
            WHEN desc_length > 200 THEN 75
            WHEN desc_length > 100 THEN 50
            WHEN desc_length > 0 THEN 25
            ELSE 0
          END
        )
      )
      ELSE 0
    END,
    
    -- Puntuación de calidad de fotos (0-100)
    CASE 
      WHEN COUNT(*) > 0 THEN (
        AVG(
          CASE 
            WHEN img_count >= 8 THEN 100 
            WHEN img_count >= 6 THEN 80
            WHEN img_count >= 4 THEN 60
            WHEN img_count >= 2 THEN 40
            WHEN img_count >= 1 THEN 20
            ELSE 0
          END
        )
      )
      ELSE 0
    END,
    
    -- Tiempo promedio de respuesta en horas
    COALESCE(
      (SELECT 
        AVG(EXTRACT(EPOCH FROM (response_at - created_at)) / 3600)
      FROM 
        seller_messages
      WHERE 
        response_at IS NOT NULL),
      0
    )
  FROM 
    seller_listings sl;
END;
$$;

-- Función para obtener tendencias de actividad
CREATE OR REPLACE FUNCTION get_seller_activity_trends(
  p_seller_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) 
RETURNS TABLE (
  date DATE,
  views INTEGER,
  contacts INTEGER,
  reservations INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Crear tabla temporal con fechas en el rango
  CREATE TEMP TABLE IF NOT EXISTS date_range AS
  SELECT generate_series(
    DATE(p_start_date), 
    DATE(p_end_date), 
    '1 day'::interval
  )::date AS date;
  
  -- Retornar los resultados
  RETURN QUERY
  SELECT 
    dr.date,
    -- Vistas (incrementos diarios)
    COALESCE(SUM(lv.view_count), 0)::INTEGER AS views,
    -- Contactos (nuevos por día)
    COALESCE(COUNT(DISTINCT m.id), 0)::INTEGER AS contacts,
    -- Reservas (nuevas por día)
    COALESCE(COUNT(DISTINCT cr.id), 0)::INTEGER AS reservations
  FROM 
    date_range dr
  LEFT JOIN (
    -- Registro diario de vistas
    SELECT 
      DATE(created_at) AS date,
      COUNT(*) AS view_count
    FROM 
      listing_views_log lvl
    JOIN 
      listings l ON lvl.listing_id = l.id
    WHERE 
      l.user_id = p_seller_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY 
      DATE(created_at)
  ) lv ON dr.date = lv.date
  LEFT JOIN (
    -- Mensajes recibidos
    SELECT 
      DATE(created_at) AS date,
      id
    FROM 
      messages
    WHERE 
      recipient_id = p_seller_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
  ) m ON dr.date = m.date
  LEFT JOIN (
    -- Reservas nuevas
    SELECT 
      DATE(cr.created_at) AS date,
      cr.id
    FROM 
      car_reservations cr
    JOIN 
      listings l ON cr.listing_id = l.id
    WHERE 
      l.user_id = p_seller_id
      AND cr.created_at >= p_start_date
      AND cr.created_at <= p_end_date
  ) cr ON dr.date = cr.date
  GROUP BY 
    dr.date
  ORDER BY 
    dr.date;
    
  -- Limpiar tabla temporal
  DROP TABLE IF EXISTS date_range;
END;
$$; 