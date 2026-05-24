const { execSync } = require("child_process");

async function clearRemoteKV() {
  console.log("Fetching keys from KV...");

  try {
    const output = execSync("npx wrangler kv key list --namespace-id fd5f0792f514411cb965f2b1fa04f0e1", { encoding: "utf-8" });
    const keys = JSON.parse(output);

    if (keys.length === 0) {
      console.log("No keys found in remote KV.");
      return;
    }

    console.log(`Found ${keys.length} keys. Deleting...`);

    const keyNames = keys.map((k) => k.name);

    for (const key of keyNames) {
      console.log(`Deleting ${key}...`);
      execSync(`npx wrangler kv key delete --namespace-id fd5f0792f514411cb965f2b1fa04f0e1 "${key}"`, { stdio: "ignore" });
    }

    console.log("Remote KV cleared successfully!");
  } catch (error) {
    console.error("Error clearing remote KV:", error.message);
  }
}

clearRemoteKV();
