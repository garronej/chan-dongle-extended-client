import { AmiCredential } from "../lib/index";
import * as path from "path";

try{

    AmiCredential.retrieve(path.join(__dirname, "..", "..", "res", "manager_virtual.conf"));

}catch(error){
    console.assert( error.message === "NO_FILE");
}


try{

    AmiCredential.retrieve(path.join(__dirname, "..", "..", "res", "manager_disabled.conf"));

}catch(error){
    console.assert( error.message === "NOT_ENABLED");
}


try{

    AmiCredential.retrieve(path.join(__dirname, "..", "..", "res", "manager_no_user.conf"));

}catch(error){
    console.assert( error.message === "NO_USER");
}

let { port, host, user, secret }= AmiCredential.retrieve(path.join(__dirname, "..", "..", "res", "manager.conf"));

console.assert(port === 5038 && host === "127.0.0.1" && user === "admin" && secret === "admin");

console.log("PASS");
