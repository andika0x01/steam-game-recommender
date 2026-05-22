-- Drop unused engine_params column since we removed the Engine component
ALTER TABLE users DROP COLUMN engine_params;

-- Rename deals_params to recommendation_params to match the new component name
ALTER TABLE users RENAME COLUMN deals_params TO recommendation_params;
