/**
 * Service to check regexps etc from generics.
 * @module check.service
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Injectable} from '@angular/core';

@Injectable()
export class Check {

    /**
     * Creates the service.
     * @function constructor
     * @public
     */
    constructor() {

    }

    /**
     * Check if a string is URL.
     * @function isURL
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    isURL(test: string): string | boolean {
        return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i.test(test)? true : 'generics.badurl'
    }

    /**
     * Check if a string is Email.
     * @function isEmail
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    isEmail(test: string): string | boolean {
        return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$/.test(test)? true : 'generics.bademail';
    }

    /**
     * Check if a string is Phone.
     * @function isPhone
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    isPhone(test: string): string | boolean {
        return /\\+(9[976]\\d|8[987530]\\d|6[987]\\d|5[90]\\d|42\\d|3[875]\\d|2[98654321]\\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\\d{1,14}$/.test(test)? true : 'generics.badphone';
    }

    /**
     * Check if a string is Date.
     * @function isDate
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    isDate(test: string): string | boolean {
        return /^([1-9]|([012][0-9])|(3[01]))\/([0]{0,1}[1-9]|1[012])\/\d\d\d\d [012]{0,1}[0-9]:[0-6][0-9]$/.test(test)? true : 'generics.baddate';
    }

    /**
     * Check if a string is an IBAN account.
     * @function isAccount
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    isAccount(test: string): string | boolean {
        test = test.replace(/^(.{4})(.*)$/, '$2$1');
        test = test.replace(/[A-Z]/g, function($e) { return $e.charCodeAt(0) - 'A'.charCodeAt(0) + 10 });
        var $sum = 0, $ei = 1;
        for(var $i = test.length - 1; $i >= 0; $i--) {
            $sum += $ei * parseInt(test.charAt($i),10);
            $ei = ($ei * 10) % 97;
        }; 
        return $sum % 97 == 1? true : 'generics.badaccount';
    }

    /**
     * Check if a string is JSON Communications object.
     * @function isCommunications
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    areCommunications(test: string): string | boolean {
        var obj = JSON.parse(test);
        if(!!obj['generics.site_url'] && this.isURL(obj['generics.site_url']) !== true)
            return 'generics.badurl';
        if(!!obj['generics.twitter'] && !/^@[^@]+$/.test(obj['generics.twitter']))
            return 'generics.badtwitter';
        return true;
    }

    /**
     * Check if a string is JSON Address object.
     * @function isAddress
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    areAddress(test: string): string | boolean {
        var obj = JSON.parse(test);
        switch(obj['generics.country']) {
            case 'BE':
                if(!/[1-9][0-9]{3}/.test(obj['generics.postcode']))
                    return 'generics.badpostcode';
                break;
            default:
                break;
        }
        return true;
    }

    /**
     * Check if a string is JSON Identity object.
     * @function isIdentity
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    areIdentity(test: string): string | boolean {
        var obj = JSON.parse(test), res;
        switch(obj['generics.country']) {
            case 'Belgium':
                res = parseInt(obj['generics.eidNo'].replace(/\.-/g, ''));
                if(Math.floor(res / 100) % 97 != res % 100)
                    return 'generics.badeidno';
                if(!!obj['generics.rrn']) {
                    res = parseInt(obj['generics.rrn'].replace(/\.-/g, ''));
                    if(97 - (Math.floor(res / 100) % 97) != res % 100)
                        return 'generics.badrrn';
                }
                break;
            default:
                break;
        }
        return true;
    }

    /**
     * Check if a string is JSON Account object.
     * @function isAccount
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    areAccount(test: string): string | boolean {
        var obj = JSON.parse(test), res;
        switch(obj['generics.country']) {
            case 'Belgium':
                if(!/^BE\d{14}$/.test(obj['generics.IBAN']) || this.isAccount(obj['generics.IBAN']) !== true)
                    return 'generics.badaccount';
                break;
            default:
                break;
        }
        return true;
    }

    /**
     * Check if a string is JSON Corporate object.
     * @function isCorporate
     * @public
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    areCorporate(test: string): string | boolean {
        var res = this.areAddress(test);
        if(res !== true)
            return res;
        var obj = JSON.parse(test);
        if(!!obj['generics.site_url'] && this.isURL(obj['generics.site_url']) !== true)
            return 'generics.badurl';
        return true;
    }

    /**
     * Check if a string has one JSON key matching mode.
     * @function keyIs
     * @public
     * @param {String} mode Mode.
     * @param {String} key Key to test.
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    keyIs(mode: string, key: string, test: string): string | boolean {
        var obj = JSON.parse(test), res;
        switch(mode) {
            case 'date':
                res = this.isDate(obj[key]);
                if(res !== true)
                    return res;
                return true;
            default:
                return true;
        }
    }

    /**
     * Check if a string has JSON keys matching modes.
     * @function keysAre
     * @public
     * @param {String[]} mode Modes.
     * @param {String[]} key Keys to test.
     * @param {String} test Input.
     * @return {String|Boolean} String containing error or true.
     */
    keysAre(mode: string[], key: string[], test: string): string | boolean {
        var res;
        for(var i = 0; i < mode.length; i++) {
            res = this.keyIs(mode[i], key[i], test);
            if(res !== true)
                return res;
        }
        return true;
    }

}