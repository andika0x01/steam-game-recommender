CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Steam ID
    name TEXT,
    avatar TEXT,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
    user_id TEXT, -- The main user
    friend_id TEXT, -- The friend's Steam ID
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tier_lists (
    user_id TEXT,
    game_appid INTEGER,
    tier TEXT, -- 'S', 'A', 'B', 'X'
    PRIMARY KEY (user_id, game_appid),
    FOREIGN KEY (user_id) REFERENCES users(id)
);