/**
 * Component for getting adverts.
 * @module getadvert.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/getadvert.html';

@Component({
    template: template
})
export class Getadvert implements OnInit {

    public query: string;
    public results: Set<{cid: string, who: string, url: string}>;
    public users: {[id: string]: any};
    private locations: {lat: number, lon: number, ccode: string}[];

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param notif Notification service.
     * @param backend Backend service.
     * @param dataservice Data service.
     */
    constructor(private notif: NotificationsService, private backend: Backend, private dataservice: Data) {
        this.locations = [];
        this.results = new Set();
        this.users = {};
    }

    /**
     * Called upon displaying.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this, got = this.filters('profile/address');
        got.forEach(function(cid) {
            self.dataservice.getData('profile/address/' + cid, false, undefined, true).then(function(data) {
                var addr = JSON.parse(data.decr_data);
                addr = JSON.parse(addr[addr.length - 1].value);
                self.dataservice.nominatim(addr, function(res) {
                    var obj = {
                        lat: Math.floor(res[0].lat * 1000)/1000,
                        lon: Math.floor(res[0].lon * 1000)/1000,
                        ccode: addr['generics.country']
                    };
                    if(self.locations.indexOf(obj) == -1)
                        self.locations.push(obj);
                }, function() {});
            });
        });
    }

    /**
     * Keys of data names known.
     * @function filters
     * @public
     * @param {String} folder to list.
     * @return {Array} Known fields.
     */
    filters(folder: string): string[] {
        return this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Follow a link.
     * @function follow
     * @param {Object} res To follow.
     */
    follow(res: {cid: string, who: string, url: string}) {
        var self = this, array = [], index = 0, result = {
            user: this.backend.profile._id,
            q: this.query
        };
        function complete() {
            var has = /\?/.test(res.url);
            res.url += (has? '&q=' : '?q=') + self.query + '&user=' + self.backend.profile._id;
            window.location.href = res.url;
        }
        //Now list what we have
        if(!!this.backend.profile.data['profile/name']) {
            array.push({
                mode: 'get',
                name: 'profile/name',
                save: 'corporate/campaigns/' + res.cid + '/' + result.user + '/name'
            });
        }
        if(!!this.backend.profile.data['profile/email/restore']) {
            array.push({
                mode: 'get',
                name: 'profile/email/restore',
                save: 'corporate/campaigns/' + res.cid + '/' + result.user + '/email'
            });
        }
        function next() {
            if(index < array.length) {
                var work = array[index];
                index++;
                switch(work.mode) {
                    case 'get':
                        self.dataservice.getData(self.backend.profile.data[work.name].id, true).then(function(data) {
                            self.dataservice.grantVault(res.who, work.save, work.name, data.decr_data, 0, new Date((new Date).getTime() + 24*60*60*1000),
                                '', false, data.decr_aes, true).then(next, next);
                        }, function(e) {
                            next();
                        });
                        break;
                    default:
                        break;
                }
            } else {
                complete();
            }
        }
        next();
    }

    /**
     * Populates the resulsts with the search.
     * @function search
     */
    search() {
        var self = this, res = [];
        this.results = new Set();
        new Set(this.locations.map(function(el) {return el.ccode})).add('WORLD').forEach(function(ccode: string) {
            self.backend.searchAds(ccode, self.locations, self.query).then(function(got) {
                res = res.concat(got);
                self.results = new Set(res);
                self.results.forEach(function(result) {
                    if(!(result.who in self.users)) {
                        self.backend.getUser(result.who).then(function(user) {
                            self.users[result.who] = user;
                            window.$('#pict__' + result.who).ready(function() {
                                if(!!user && !!user.company_info && !!user.company_info.picture)
                                    window.$('#pict__' + result.who).attr('src', user.company_info.picture);
                                else
                                    window.$('#pict__' + result.who).attr('src', 'assets/logo.png');
                            });
                        }, function(e) {
                            window.$('#pict__' + result.who).attr('src', 'assets/logo.png');
                        });
                    }
                });
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('advert.getError'));
            });
        });
    }

}
