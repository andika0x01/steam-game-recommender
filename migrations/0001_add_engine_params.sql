-- Migration to add engine_params column for CI tuning
ALTER TABLE users ADD COLUMN engine_params TEXT;
