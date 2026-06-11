-- Dedup vendors: merge duplicate names (case-insensitive), keep the one with more topics
WITH dup AS (
  SELECT lower(trim(name)) as norm, array_agg(id ORDER BY array_length(topics, 1) DESC NULLS LAST) as ids
  FROM vendors
  GROUP BY lower(trim(name))
  HAVING count(*) > 1
)
DELETE FROM vendors
WHERE id IN (SELECT unnest(ids[2:]) FROM dup);

-- Clean up gcp/azure/anthropic that came from products but don't match company slugs
DELETE FROM vendors WHERE lower(name) IN ('gcp', 'cisco');
