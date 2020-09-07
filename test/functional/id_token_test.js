const { defaultFetcher } = require("../../id_token.js");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const CLIENT_ID = "218789274679-o3mm4cn117g7fgg2ftp3uui1i813pid2.apps.googleusercontent.com";
const keys = JSON.parse(fs.readFileSync("./credentials/iota-test.json", "utf8"));

describe("Token Tests", () => {
  defaultFetcher.setKeys(keys);
  defaultFetcher.setClientId(CLIENT_ID);

  test("Get an id_token", async () => {
    const id_token = await defaultFetcher.getToken();

    // We just decode. Do not verify
    expect(jwt.decode(id_token).aud).toBe(CLIENT_ID);
  });

  test("Refresh id_token produces a different id_token", async () => {
    const id_token1 = await defaultFetcher.getToken();

    // Wait to obtain a new token
    const p = new Promise((resolve, reject) => {
      setTimeout(async () => {
        const t2 = await defaultFetcher.refreshToken();
        resolve(t2);
      }, 3000);
    });

    const id_token2 = await p;

    const decoded1 = jwt.decode(id_token1);
    const decoded2 = jwt.decode(id_token2);

    expect(decoded1.aud).toBe(CLIENT_ID);
    expect(decoded2.aud).toBe(CLIENT_ID);

    expect(decoded2.exp > decoded1.exp).toBe(true);
  });

});
