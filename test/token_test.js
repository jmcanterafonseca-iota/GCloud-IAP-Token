const { defaultFetcher } = require( "../token.js");
const fs = require("fs");

const CLIENT_ID = "218789274679-o3mm4cn117g7fgg2ftp3uui1i813pid2.apps.googleusercontent.com";
const keys = JSON.parse(fs.readFileSync("./credentials/iota-test.json", "utf8"));

describe("getToken", () => {
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
    const expected = [];
    for (let j = 0; j < total; j++) {
      expected.push(id_token);
    }

    expect(id_tokens).toEqual(expected);
  });
});
