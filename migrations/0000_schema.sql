CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, 
    name TEXT,
    avatar TEXT,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
    user_id TEXT, 
    friend_id TEXT, 
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tier_lists (
    user_id TEXT,
    game_appid INTEGER,
    tier TEXT, 
    PRIMARY KEY (user_id, game_appid),
    FOREIGN KEY (user_id) REFERENCES users(id)
);