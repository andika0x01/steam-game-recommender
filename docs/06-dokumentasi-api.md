# Dokumentasi API Eksternal

Dokumen ini merinci API eksternal yang digunakan dalam proyek **Steam Game Recommender**.

## 1. Steam Web API
Digunakan untuk mengambil data profil pengguna dan perpustakaan game. Memerlukan `STEAM_API_KEY`.

### A. GetPlayerSummaries (v2)
*   **Endpoint:** `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`
*   **Method:** `GET`
*   **Parameter:** `key`, `steamids`
*   **Response Sample:**
    ```json
    {
      "response": {
        "players": [
          {
            "steamid": "76561198000000000",
            "personaname": "Gaben",
            "profileurl": "https://steamcommunity.com/id/example/",
            "avatarfull": "https://avatars.akamai.steamstatic.com/...",
            "personastate": 1
          }
        ]
      }
    }
    ```

### B. GetOwnedGames (v1)
*   **Endpoint:** `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`
*   **Method:** `GET`
*   **Parameter:** `key`, `steamid`, `include_appinfo=1`, `include_played_free_games=1`
*   **Response Sample:**
    ```json
    {
      "response": {
        "game_count": 1,
        "games": [
          {
            "appid": 400,
            "name": "Portal",
            "playtime_forever": 500,
            "img_icon_url": "..."
          }
        ]
      }
    }
    ```

### C. ResolveVanityURL (v1)
*   **Endpoint:** `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/`
*   **Method:** `GET`
*   **Parameter:** `key`, `vanityurl`
*   **Response Sample:**
    ```json
    {
      "response": {
        "steamid": "76561198000000000",
        "success": 1
      }
    }
    ```

---

## 2. Steam Store API
Digunakan untuk mengambil detail game publik (deskripsi, genre, dll). Tidak memerlukan API key untuk data publik.

*   **Endpoint:** `https://store.steampowered.com/api/appdetails`
*   **Method:** `GET`
*   **Parameter:** `appids`
*   **Response Sample (AppID 400 - Portal):**
    ```json
    {
      "400": {
        "success": true,
        "data": {
          "type": "game",
          "name": "Portal",
          "steam_appid": 400,
          "genres": [
            { "id": "1", "description": "Action" }
          ]
        }
      }
    }
    ```

---

## 3. SteamSpy API
Digunakan untuk mencari game berdasarkan kategori atau tag tertentu.

*   **Endpoint:** `https://steamspy.com/api.php`
*   **Method:** `GET`
*   **Parameter:** `request=tag`, `tag={tag_name}`
*   **Response Sample:**
    ```json
    {
      "400": {
        "appid": 400,
        "name": "Portal",
        "developer": "Valve",
        "publisher": "Valve",
        "owners": "10,000,000 .. 20,000,000",
        "average_forever": 612,
        "price": "999"
      }
    }
    ```

---

## 4. CheapShark API
Digunakan untuk mencari penawaran harga (deals) game PC (fokus pada Steam).

*   **Endpoint:** `https://www.cheapshark.com/api/1.0/deals`
*   **Method:** `GET`
*   **Parameter:** `storeID=1` (Steam), `upperPrice`, `onSale`, `pageNumber`
*   **Response Sample:**
    ```json
    [
      {
        "title": "NBA 2K26",
        "salePrice": "9.79",
        "normalPrice": "69.99",
        "savings": "86.012287",
        "steamAppID": "3472040"
      }
    ]
    ```

---

## 5. Steam OpenID
Digunakan untuk autentikasi tanpa harus menyimpan password pengguna.

*   **URL:** `https://steamcommunity.com/openid/login`
*   **Workflow:** Pengguna diarahkan ke URL ini dengan parameter OpenID 2.0, lalu diarahkan kembali ke aplikasi dengan token verifikasi.

---

## 6. Steam CDN (Media)
Digunakan untuk mengambil aset visual game (capsules, library images).

*   **Library Image (Portrait):** `https://cdn.akamai.steamstatic.com/steam/apps/{appid}/library_600x900.jpg`
*   **Header Image:** `https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header.jpg`
