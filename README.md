# node-spoofmac

A very quick port of https://github.com/feross/SpoofMAC/ for OSX to Node.js.

    $ npm install -g spoofmac
    $ spoofmac en0
    Using random MAC address.
    MAC address for  en0 9b
    Changed en0 (h/w: 31) from 9b to 53.
    If both addresses are the same, run 'ifconfig en0 | grep ether' in a few seconds.

`en0` is wired, `en1` is wireless, *except on Macbook Air or retina Macbook Pro*.