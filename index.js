#!/usr/bin/env node

var exec = require('child_process').exec
  , randomMac = require('random-mac');

var WIRELESS_INTERFACE = "0123456789ab"
var WIRED_INTERFACE = "cdef12345678"

// Path to Airport binary. This works on 10.7 and 10.8, but might be different in older OS X versions.
var PATH_TO_AIRPORT = "/System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport"

function getMACAddress (interface, hardware, next) {
  // Returns current MAC address on given interface.
  // If hardware is true, then return the actual hardware MAC address."""
  if (hardware) {
    exec('networksetup -getmacaddress ' + interface, search);
  } else {
    exec(["ifconfig", interface, "| grep ether"].join(' '), search);
  }

  function search (err, stdout) {
    var match = (stdout || '').toString('utf-8').match(/([0-9a-fA-F]{2}:?){6}/);
    next(match && match[1]);
  }
}
  
function setMACAddress (interface, address, next) {
  getMACAddress(interface, false, function (oldAddress) {
    console.log('MAC address for ', interface, oldAddress);
    // Turn airport power on & disassociate from connected network
    // This appears to be required even for wired (en0)
    exec(["networksetup", '-setairportpower', 'en1', 'on'], function (err) {
      exec([PATH_TO_AIRPORT, '-z'].join(' '), function (err) {
        if (err) {
          console.error('Error code', err, 'invoking airport. Are you root?')
          process.exit(1);
        }
        
        // Set MAC address.
        exec(["ifconfig", interface, "ether", address].join(' '), function (err) {
          // Associate airport with known network (if any)
          exec(["networksetup", "-detectnewhardware"].join(' '), function (err) {
            // Print result
            getMACAddress(interface, false, function (newAddress) {
              getMACAddress(interface, true, function (hardwareAddress) {
                console.log('Changed %s (h/w: %s) from %s to %s.', interface, hardwareAddress, oldAddress, newAddress);
                console.log("If both addresses are the same, run 'ifconfig %s | grep ether' in a few seconds.", interface);
                next && next();
              });
            })
          });
        });
      })  
    });
  });
}

exports.getMACAddress = getMACAddress;
exports.setMACAddress = setMACAddress;

if (require.main == module) {
  if (process.argv.length >= 3 && process.argv[2] == "-h") {
    console.error("sudo python SpoofMAC.py <interface> <mac_address> (For <interface>, use en0 for wired or en1 for wireless)");
    console.error("Example: sudo python SpoofMAC.py en1 12:12:12:12:12:12");
    process.exit(1);
  } else if (process.argv.length == 2) {
    console.log("Using default MAC adresses for en0 and en1.");
    setMACAddress("en0", WIRED_INTERFACE, function () {
      setMACAddress("en1", WIRELESS_INTERFACE);
    });
  } else if (process.argv.length == 3) {
    console.error("Using random MAC address.");
    var interface = process.argv[2], address = randomMac();
    setMACAddress(interface, address);
  } else if (process.argv.length == 4) {
    console.error("Using manual MAC address.");
    var interface = process.argv[2], address = process.argv[3];
    setMACAddress(interface, address)
  } else {
    console.error("Wrong number of arguments.");
    process.exit(1);
  }
}