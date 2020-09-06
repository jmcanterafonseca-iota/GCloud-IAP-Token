import { defaultFetcher } from "./token.js";
import fs from "fs";

const CLIENT_ID = "218789274679-o3mm4cn117g7fgg2ftp3uui1i813pid2.apps.googleusercontent.com";
const keys = JSON.parse(fs.readFileSync("../zebra-auth/credentials/iota-test.json", "utf8"));

defaultFetcher.setKeys(keys);
defaultFetcher.setClientId(CLIENT_ID);

defaultFetcher.getToken().then((id_token) => console.log(id_token), (error) => console.error(error));

defaultFetcher.getToken().then((id_token) => console.log(id_token), (error) => console.error(error));

defaultFetcher.getToken().then((id_token) => console.log(id_token), (error) => console.error(error));

defaultFetcher.getToken().then((id_token) => console.log(id_token), (error) => console.error(error));
