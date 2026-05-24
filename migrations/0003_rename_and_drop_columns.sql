
ALTER TABLE users DROP COLUMN engine_params;


ALTER TABLE users RENAME COLUMN deals_params TO recommendation_params;
