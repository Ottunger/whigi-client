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
     * @return {String[]|Boolean} String containing error or true.
     */
    isURL(test: string): string[] | boolean {
        return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i.test(test)? true : ['generics.badurl', '']
    }

    /**
     * Check if a string is Email.
     * @function isEmail
     * @public
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    isEmail(test: string): string[] | boolean {
        return test === undefined || /^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/.test(test)? true : ['generics.bademail', ''];
    }

    /**
     * Check if a string is Phone.
     * @function isPhone
     * @public
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    isPhone(test: string): string[] | boolean {
        return test === undefined || /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/.test(test)? true : ['generics.badphone', ''];
    }

    /**
     * Check if a string is Date.
     * @function isDate
     * @public
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    isDate(test: string): string[] | boolean {
        return test === undefined || /^([1-9]|([012][0-9])|(3[01]))\/([0]?[1-9]|1[012])\/\d\d\d\d(\s+[012]?[0-9]:[0-6][0-9])?$/.test(test)? true : ['generics.baddate', ''];
    }

    /**
     * Check if a string is an IBAN account.
     * @function isAccount
     * @public
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    isAccount(test: string): string[] | boolean {
        test = test.replace(/^(.{4})(.*)$/, '$2$1');
        test = test.replace(/[A-Z]/g, <any>(function($e) { return $e.charCodeAt(0) - 'A'.charCodeAt(0) + 10 }));
        var $sum = 0, $ei = 1;
        for(var $i = test.length - 1; $i >= 0; $i--) {
            $sum += $ei * parseInt(test.charAt($i),10);
            $ei = ($ei * 10) % 97;
        }; 
        return $sum % 97 == 1? true : ['generics.badaccount', ''];
    }

    /**
     * Check if a string is JSON Communications object.
     * @function isCommunications
     * @public
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    areCommunications(test: string): string[] | boolean {
        var obj = JSON.parse(test), ret: string[] = [];
        if(!!obj['generics.site_url'] && this.isURL(obj['generics.site_url']) !== true)
            ret = ['generics.badurl', 'generics.site_url'];
        if(!!obj['generics.twitter'] && !/^@[^@]+$/.test(obj['generics.twitter']))
            if(ret.length == 0)
                ret = ['generics.badtwitter', 'generics.twitter'];
            else
                ret.push('generics.twitter');
        return ret.length == 0? true : ret;
    }

    /**
     * Check if a string is JSON Address object.
     * @function isAddress
     * @public
     * @param {String} test Input.
     * @param {Boolean} noparse If object is given.
     * @return {String[]|Boolean} String containing error or true.
     */
    areAddress(test: string, noparse?: boolean): string[] | boolean {
        var obj = (noparse === true)? test : JSON.parse(test);
        switch(obj['generics.country']) {
            case 'BEL':
                if(!/^[1-9][0-9]{3}$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
            case 'FRA':
                if(!/^((0[1-9])|([1-8][0-9])|(9[0-8])|(2A)|(2B))[0-9]{3}$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
            case 'DEU':
                if(!/^((?:0[1-46-9]\d{3})|(?:[1-357-9]\d{4})|(?:[4][0-24-9]\d{3})|(?:[6][013-9]\d{3}))$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
            case 'ITA':
                if(!/^(V-|I-)?[0-9]{5}$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
            case 'LUX':
                if(!/^L-[1-9][0-9]{3}$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
            case 'NLD':
                if(!/^[1-9][0-9]{3}\s?([a-zA-Z]{2})?$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
            case 'ESP':
                if(!/^([1-9]{2}|[0-9][1-9]|[1-9][0-9])[0-9]{3}$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
            case 'GBR':
                if(!/^(GIR|[A-Z]\d[A-Z\d]??|[A-Z]{2}\d[A-Z\d]??)[ ]??(\d[A-Z]{2})$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
                break;
             case 'USA':
                if(!/^[1-9][0-9]{3}$/.test(obj['generics.postcode']))
                    return ['generics.badpostcode', 'generics.postcode'];
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
     * @param {Boolean} noparse To not parse.
     * @return {String[]|Boolean} String containing error or true.
     */
    areIdentity(test: string, noparse?: boolean): string[] | boolean {
        var obj = noparse === true? test : JSON.parse(test), res, ret: string[] = [];
        for(var i = 0; i < obj.length ; i++) {
            var loc = JSON.parse(obj[i].value);
            switch(loc['generics.country']) {
                case 'BEL':
                    if(!!loc['generics.eidNo']) {
                        res = parseInt(loc['generics.eidNo'].replace(/[\.-]/g, ''));
                        if(Math.floor(res / 100) % 97 != res % 100)
                            ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    if(!!loc['generics.rrn']) {
                        res = parseInt(loc['generics.rrn'].replace(/[\.-]/g, ''));
                        if(97 - (Math.floor(res / 100) % 97) != res % 100) {
                            if(ret.length == 0)
                                ret = ['generics.badrrn', 'generics.rrn'];
                            else
                                ret.push('generics.rrn');
                        }
                    }
                    if(!!loc['generics.driving'] && !/^[0-9]{10}$/.test(loc['generics.driving'])) {
                        if(ret.length == 0)
                            ret = ['generics.baddriving', 'generics.driving'];
                        else
                            ret.push('generics.driving');
                    }
                    break;
                case 'FRA':
                    if(!!loc['generics.eidNo'] && !/^[0-9a-zA-Z]{12,13}$/.test(loc['generics.eidNo'])) {
                        ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    if(!!loc['generics.driving'] && !/^[0-9]{2}[A-Z]{2}[0-9]{5}$/.test(loc['generics.driving'])) {
                        if(ret.length == 0)
                            ret = ['generics.baddriving', 'generics.driving'];
                        else
                            ret.push('generics.driving');
                    }
                    break;
                case 'DEU':
                    if(!!loc['generics.eidNo'] && !/^T[0-9]{8}$/.test(loc['generics.eidNo'])) {
                        ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    if(!!loc['generics.driving'] && !/^[A-Z][0-9]{3}[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(loc['generics.driving'])) {
                        if(ret.length == 0)
                            ret = ['generics.baddriving', 'generics.driving'];
                        else
                            ret.push('generics.driving');
                    }
                    break;
                case 'ITA':
                    if(!!loc['generics.eidNo'] && !/^[0-9]{5}$/.test(loc['generics.eidNo'])) {
                        ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    break;
                case 'LUX':
                    if(!!loc['generics.eidNo'] && !/^[0-9]{12}$/.test(loc['generics.eidNo'])) {
                        ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    if(!!loc['generics.driving'] && !/^[0-9]{6}$/.test(loc['generics.driving'])) {
                        if(ret.length == 0)
                            ret = ['generics.baddriving', 'generics.driving'];
                        else
                            ret.push('generics.driving');
                    }
                    break;
                case 'NLD':
                    if(!!loc['generics.eidNo'] && !/^[A-Z]{7}[0-9]{2}$/.test(loc['generics.eidNo'])) {
                        ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    if(!!loc['generics.driving'] && !/^[0-9]{10}$/.test(loc['generics.driving'])) {
                        if(ret.length == 0)
                            ret = ['generics.baddriving', 'generics.driving'];
                        else
                            ret.push('generics.driving');
                    }
                    break;
                case 'ESP':
                    if(!!loc['generics.eidNo'] && !/^[A-Z]{3}[0-9]{6}$/.test(loc['generics.eidNo'])) {
                        ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    if(!!loc['generics.driving'] && !/^[0-9]{8}-[0-9A-Z]$/.test(loc['generics.driving'])) {
                        if(ret.length == 0)
                            ret = ['generics.baddriving', 'generics.driving'];
                        else
                            ret.push('generics.driving');
                    }
                    break;
                case 'GBR':
                    if(!!loc['generics.eidNo'] && !/^[0-9]{9}$/.test(loc['generics.eidNo'])) {
                        ret = ['generics.badeidno', 'generics.eidNo'];
                    }
                    if(!!loc['generics.driving'] && !/^[A-Z]+[0-9]{6}[A-Z]{6}$/.test(loc['generics.driving'])) {
                        if(ret.length == 0)
                            ret = ['generics.baddriving', 'generics.driving'];
                        else
                            ret.push('generics.driving');
                    }
                    break;
                default:
                    break;
            }
        }
        return ret.length == 0? true : ret;
    }

    /**
     * Check if a string is JSON Account object.
     * @function isAccount
     * @public
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    areAccount(test: string): string[] | boolean {
        var obj = JSON.parse(test), res;
        for(var i = 0; i < obj.length; i++) {
            var loc = JSON.parse(obj[i].value);
            switch(loc['generics.country']) {
                case 'BEL':
                    if(!/^BE\d{14}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                case 'FRA':
                    if(!/^FR\d{12}[0-9A-Z]{11}\d{2}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                case 'DEU':
                    if(!/^DE\d{20}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                case 'ITA':
                    if(!/^IT\d{2}[A-Z]\d{10}[0-9A-Z]{12}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                case 'LUX':
                    if(!/^LU\d{5}[0-9A-Z]{13}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                case 'NLD':
                    if(!/^NL\d{2}[A-Z]{4}\d{10}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                case 'ESP':
                    if(!/^ES\d{22}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                case 'GBR':
                    if(!/^GB\d{2}[A-Z]{4}\d{14}$/.test(loc['generics.IBAN']) || this.isAccount(loc['generics.IBAN']) !== true)
                        return ['generics.badaccount', 'generics.IBAN'];
                    break;
                default:
                    break;
            }
        }
        return true;
    }

    /**
     * Check if a string is JSON Corporate object.
     * @function isCorporate
     * @public
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    areCorporate(test: string): string[] | boolean {
        var obj = JSON.parse(test);
        for(var i = 0; i < obj.length; i++) {
            var loc = JSON.parse(obj[i].value);
            if(!!loc['generics.site_url'] && this.isURL(loc['generics.site_url']) !== true)
                return ['generics.badurl', 'generics.site_url'];
        }
        return true;
    }

    /**
     * Check if a string has one JSON key matching mode.
     * @function keyIs
     * @public
     * @param {String} mode Mode.
     * @param {String} key Key to test.
     * @param {String} test Input.
     * @param {Boolean} maybe Maybe.
     * @return {String[]|Boolean} String containing error or true.
     */
    keyIs(mode: string, key: string, test: string, maybe?: boolean): string[] | boolean {
        var obj = JSON.parse(test), res, ret: string[] = [];
        obj = (obj.constructor === Array)? obj : [{value: test}];
        for(var i = 0; i < obj.length; i++) {
            var loc = JSON.parse(obj[i].value);
            switch(mode) {
                case 'date':
                    if(maybe && !loc[key])
                        break;
                    res = this.isDate(loc[key]);
                    if(res !== true) {
                        if(ret.length == 0)
                            ret = [res[0], key];
                        else
                            ret.push(key);
                    }
                    break;
                default:
                    break;
            }
        }
        return ret.length == 0? true : ret;
    }

    /**
     * Check if a string has JSON keys matching modes.
     * @function keysAre
     * @public
     * @param {String[]} mode Modes.
     * @param {String[]} key Keys to test.
     * @param {String} test Input.
     * @param {Boolean} maybe Maybe.
     * @return {String[]|Boolean} String containing error or true.
     */
    keysAre(mode: string[], key: string[], test: string, maybe?: boolean): string[] | boolean {
        var res, ret: string[] = [];
        for(var i = 0; i < mode.length; i++) {
            switch(mode[i]) {
                case 'identity':
                    res = this.areIdentity(test);
                    if(res !== true) {
                        if(ret.length == 0)
                            ret = res;
                        else
                            ret.push(...res.slice(1));
                    }
                    break;
                default:
                    res = this.keyIs(mode[i], key[i], test, maybe);
                    if(res !== true) {
                        if(ret.length == 0)
                            ret = res;
                        else
                            ret.push(...res.slice(1));
                    }
                    break;
            }
        }
        return ret.length == 0? true : ret;
    }

    /**
     * Check if a times value matches at all stages.
     * @function allAre
     * @public
     * @param {String} mode Mode.
     * @param {String} test Input.
     * @return {String[]|Boolean} String containing error or true.
     */
    allAre(mode: string, test: string): string[] | boolean {
        var obj = JSON.parse(test);
        for(var i = 0; i < obj.length; i++) {
            switch(mode) {
                case 'address':
                    var ret = this.areAddress(obj[i].value);
                    if(ret !== true)
                        return ret;
                    break;
                default:
                    break;
            }
        }
        return true;
    }
}