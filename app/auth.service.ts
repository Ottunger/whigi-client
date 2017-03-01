/**
 * Service to manage logged in accounts.
 * @module auth.service
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Injectable} from '@angular/core';

@Injectable()
export class Auth {

    public uid: string;
    private logged: boolean;
    private oids: {[id: string]: string};

    /**
     * Creates the service.
     * @function constructor
     * @public
     */
    constructor() {
        this.uid = '';
        if('token' in localStorage) {
            this.oids = JSON.parse(localStorage.getItem('token'));
            this.uid = localStorage.getItem('uid') || Object.getOwnPropertyNames(this.oids)[0];
            this.logged = true;
        } else {
            this.oids = {};
            this.logged = false;
        }
    }

    /**
     * Check if logged.
     * @function isLogged
     * @public
     * @return {Boolean} True if at least one logged in.
     */
    isLogged(): boolean {
        return this.logged;
    }

    /**
     * Check if loaded.
     * @function isLoaded
     * @public
     * @return {Boolean} True if at least one loaded in.
     */
    isLoaded(): boolean {
        return this.logged && ('key_decryption' + this.uid) in localStorage;
    }

    /**
     * Save a new mapping.
     * @function addLogin
     * @public
     * @param {String} uid Granted.
     * @param {String} token Token.
     */
    addLogin(uid: string, token: string) {
        this.oids[uid] = token;
        localStorage.setItem('token', JSON.stringify(this.oids));
    }

    /**
     * Start serving a new login.
     * @function switchLogin
     * @public
     * @param {String} uid New login.
     * @param {String} puzzle Known puzzle.
     * @param {String} cv Known decryption key.
     * @param {String} psha Known hash.
     * @return {Boolean} Whether now logged.
     */
    switchLogin(uid: string, token?: string, puzzle?: string, ck?: string, psha?: string): boolean {
        this.uid = uid;
        localStorage.setItem('uid', this.uid);
        if(!!token)
            this.addLogin(uid, token);
        this.regPuzzle(puzzle, ck, psha);
        this.logged = this.uid in this.oids;
        return this.logged;
    }

    /**
     * Registers the puzzle.
     * @function regPuzzle
     * @public
     * @param {String} puzzle Known puzzle.
     * @param {String} cv Known decryption key.
     * @param {String} psha Known hash.
     */
    regPuzzle(puzzle?: string, ck?: string, psha?: string) {
        if(!!puzzle)
            localStorage.setItem('puzzle' + this.uid, puzzle);
        if(!!ck)
            localStorage.setItem('key_decryption' + this.uid, ck);
        if(!!psha)
            localStorage.setItem('psha' + this.uid, psha);
    }

    /**
     * Flush all.
     * @function clear
     * @public
     */
    clear() {
        localStorage.clear();
        this.oids = {};
        this.uid = '';
        this.logged = false;
    }

    /**
     * Get auth params.
     * @function getParams
     * @public
     * @return {String[]} Params.
     */
    getParams(): string[] {
        return [
            this.oids[this.uid],
            localStorage.getItem('puzzle' + this.uid),
            localStorage.getItem('key_decryption' + this.uid),
            localStorage.getItem('psha' + this.uid),
            this.uid
        ]
    }

    /**
     * Remove a mapping.
     * @function deleteUid
     * @public
     * @param {String} uid To remove.
     * @param {Boolean} flush Whether to flush localStorage.
     * @return {Boolean} Whether now logged.
     */
    deleteUid(uid?: string, flush?: boolean): boolean {
        delete this.oids[!!uid? uid : this.uid];
        localStorage.setItem('token', JSON.stringify(this.oids));
        this.logged = this.uid in this.oids;
        if(flush) {
            localStorage.removeItem('puzzle' + this.uid);
            localStorage.removeItem('key_decryption' + this.uid);
            localStorage.removeItem('psha' + this.uid);
        }
        return this.logged;
    }

    /**
     * Notify a username change.
     * @function changedUname
     * @public
     * @param {String} before Before uname.
     * @param {String} after After uname.
     */
    changedUname(before: string, after: string) {
        this.oids[after] = this.oids[before];
        delete this.oids[before];
        localStorage.setItem('token', JSON.stringify(this.oids));
        localStorage.setItem('puzzle' + after, localStorage.getItem('puzzle' + before));
        localStorage.removeItem('puzzle' + before);
        localStorage.setItem('key_decryption' + after, localStorage.getItem('key_decryption' + before));
        localStorage.removeItem('key_decryption' + before);
        localStorage.setItem('psha' + after, localStorage.getItem('psha' + before));
        localStorage.removeItem('psha' + before);
    }

    /**
     * Flushes login.
     * @function emptyUid
     * @public
     */
    emptyUid() {
        this.uid = '';
        this.logged = false;
    }

    /**
     * Currently logged in accounts.
     * @public
     * @function choices
     * @return {String[]} Choices.
     */
    choices(): string[] {
        return Object.getOwnPropertyNames(this.oids).filter(function(el) {
            return !/^wiuser/.test(el);
        });
    }

}