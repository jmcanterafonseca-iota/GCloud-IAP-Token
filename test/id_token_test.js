const { defaultFetcher } = require("../id_token.js");
const fs = require("fs");

const CLIENT_ID = "218789274679-o3mm4cn117g7fgg2ftp3uui1i813pid2.apps.googleusercontent.com";
const keys = JSON.parse(fs.readFileSync("./credentials/iota-test.json", "utf8"));

describe("Token Tests", () => {
  defaultFetcher.setKeys(keys);
  defaultFetcher.setClientId(CLIENT_ID);

  test("Asking several times in parallel produces same id_token", async () => {
    const total = 4;

    const promises = [];
    for (let j = 0; j < total; j++) {
      promises.push(defaultFetcher.getToken());
    }

    const id_tokens = await Promise.all(promises);

    // All id_tokens obtained should be identical
    const id_token = id_tokens[0];
    expect(id_token.length > 0).toBe(true);

    const expected = [];
    for (let j = 0; j < total; j++) {
      expected.push(id_token);
    }

    expect(id_tokens).toEqual(expected);
  });

  test("Refresh token produces a different id_token", async () => {
    const id_token1 = await defaultFetcher.getToken();

    // Wait some seconds to guarantee that the token will be actually refreshed
    const p = new Promise((resolve, reject) => {
      setTimeout(async () => {
        const t2 = await defaultFetcher.refreshToken();
        resolve(t2);
      }, 3000);
    });

    const id_token2 = await p;
    const id_token3 = await defaultFetcher.getToken();

    expect(id_token1 !== id_token2).toBe(true);
    expect(id_token2 === id_token3).toBe(true);
  });

  test("Refresh token at the same time leads to same new id_token", async () => {
    const id_token1 = await defaultFetcher.getToken();

    // Wait some seconds to guarantee that the token will be actually refreshed
    const p = new Promise((resolve, reject) => {
      setTimeout(async () => {
        const tokens = await Promise.all([defaultFetcher.refreshToken(), defaultFetcher.refreshToken()]);
        resolve(tokens);
      }, 3000);
    });

    const id_tokens = await p;

    expect(id_tokens[0] === id_tokens[1]).toBe(true);
    expect(id_tokens[0] !== id_token1).toBe(true);
  });
});
