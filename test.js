import { tokenRetriever } from "./token.js";
import fs from "fs";

const CLIENT_ID = "218789274679-o3mm4cn117g7fgg2ftp3uui1i813pid2.apps.googleusercontent.com";
const keys = JSON.parse(fs.readFileSync("./credentials/iota-test.json", "utf8"));

tokenRetriever.setKeys(keys);
tokenRetriever.set_client_id(CLIENT_ID);

tokenRetriever.get_id_token().then((id_token) => console.log(id_token), (error) => console.error(error));

tokenRetriever.get_id_token().then((id_token) => console.log(id_token), (error) => console.error(error));

tokenRetriever.get_id_token().then((id_token) => console.log(id_token), (error) => console.error(error));

tokenRetriever.get_id_token().then((id_token) => console.log(id_token), (error) => console.error(error));
