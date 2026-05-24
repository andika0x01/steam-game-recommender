export const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

export function getSteamAuthUrl(returnUrl: string) {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": new URL(returnUrl).origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamAuth(url: string) {
  const { searchParams } = new URL(url);
  const params = new URLSearchParams(searchParams);
  params.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const text = await response.text();
  const isValid = text.includes("is_valid:true");

  if (!isValid) return null;

  const claimedId = searchParams.get("openid.claimed_id");
  if (!claimedId) return null;

  const steamId = claimedId.split("/").pop();
  return steamId || null;
}
