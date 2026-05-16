-- Migration to add deals_params column for Deal Hunter optimization
ALTER TABLE users ADD COLUMN deals_params TEXT;
