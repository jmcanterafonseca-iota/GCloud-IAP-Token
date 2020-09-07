const { defaultFetcher } = require("../../id_token.js");

describe("Token Tests", () => {
  defaultFetcher.setKeys({});
  defaultFetcher.setClientId("dummy");

  // Mock JWT generation
  defaultFetcher._selfSignJwt = jest.fn().mockReturnValue("abcedef");

  // Some boilerplate for mocking POST token generation
  let sequence = 1;
  const tokenGenerator = function() {
    return Promise.resolve(new Response(sequence++));
  }
  const Response = class {
    constructor(sequence) {
      this.sequence = sequence;

      this.ok = true;

      this.headers = {
        get (header) {
          return "application/json";
        }
      }
    }
    json() {
      return Promise.resolve({ "id_token": String(this.sequence)});
    }
  };

  // Mock the POST to the server
  defaultFetcher._postAuthServer = jest.fn(tokenGenerator);

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

    const id_token2 = await defaultFetcher.refreshToken();
    const id_token3 = await defaultFetcher.getToken();

    expect(id_token1 !== id_token2).toBe(true);
    expect(id_token2 === id_token3).toBe(true);
  });

  test("Refresh token at the same time leads to same new id_token", async () => {
    const id_token1 = await defaultFetcher.getToken();

    const id_tokens = await Promise.all([defaultFetcher.refreshToken(), defaultFetcher.refreshToken()]);
  
    expect(id_tokens[0] === id_tokens[1]).toBe(true);
    expect(id_tokens[0] !== id_token1).toBe(true);
  });

});
