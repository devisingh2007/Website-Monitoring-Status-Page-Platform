import { lookup } from "node:dns/promises";
/**
//! lookup use to find ip Address using DNS example 
//? const result = await lookup("google.com");
//? console.log(result);
* TODO output 
//! {
//!  address: "142.250.183.14",
//!  family: 4
//!}

*/
import ipaddr from "ipaddr.js";

export async function validateMonitorTarget(input: string): Promise<{valid:boolean,message:string}> {
  try {
    const url = new URL(input);

    
    if (url.protocol!=="http:"&&url.protocol!== "https:") {
      return {
        valid: false,
        message: "Only HTTP and HTTPS URLs are allowed",
      };
    }


    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/, "");

    
    if (hostname === "localhost" ||hostname.endsWith(".localhost") ||hostname.endsWith(".local") ||hostname.endsWith(".internal")) {
      return {
        valid: false,
        message: "Local and internal hostnames are not allowed"
      };
    }

  
    const addresses = ipaddr.isValid(hostname)? [hostname]: (await lookup(hostname, { all: true })).map((record) => record.address);
//! ipaddr.isValid check ip address and return boolean value
 //! all:true because lookop return a object with ip address like 
//? TODO IPv4 and IPv6
    if (addresses.length === 0) {
      return {
        valid: false,
        message: "Hostname could not be resolved",
      };
    }

    
    for (const address of addresses) {
      const parsed = ipaddr.parse(address)

      if (parsed.range() !== "unicast") { //? allowe only public IP addresses
        return {
          valid: false,
          message: "Private or reserved IP addresses are not allowed",
        };
      }
    }
    //! ipaddr.parse use to create a ip Object to apply all ipaddr.js methods on it
    //! range() to find which type of this ip address 

    return {
      valid: true,
      message: "Monitor target is valid",
    };
  } catch {
    return {
      valid: false,
      message: "Invalid URL or hostname",
    };
  }
}
