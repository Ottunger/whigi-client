/**
 * Component for creating adverts.
 * @module makeadvert.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, ApplicationRef, OnInit} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/makeadvert.html';

@Component({
    template: template
})
export class Makeadvert implements OnInit {

    public radius: number;
    public address: string;
    public topics: string;
    public campaigns: {[id: string]: {
        radius: number,
        lat: number,
        lon: number,
        topics: string,
        until: string,
        target: string
    }};

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend Backend service.
     * @param check Check service.
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend, 
        private check: ApplicationRef, private dataservice: Data) {
        this.campaigns = {};
    }

    /**
     * Called upon displaying.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this, got = this.filters('corporate/campaigns');
        got.forEach(function(cid) {
            self.dataservice.getData('corporate/campaigns/' + cid, false, undefined, true).then(function(data) {
                try {
                    var cp = JSON.parse(data.decr_data);
                } catch(e) {
                    return;
                }
                self.campaigns[cid] = {
                    radius: cp.radius,
                    lat: cp.lat,
                    lon: cp.lon,
                    topics: cp.topics,
                    until: '',
                    target: ''
                }
                var keys = Object.getOwnPropertyNames(self.backend.profile.data['corporate/campaigns/' + cid].shared_to);
                for(var j = 0; j < keys.length; j++) {
                    if(keys[j].indexOf('whigi-advert') == 0) {
                        self.backend.getAccessVault(self.backend.profile.data['corporate/campaigns/' + cid].shared_to[keys[j]]).then(function(info) {
                            self.campaigns[cid].until = new Date(info.expire_epoch).toLocaleString(self.translate.currentLang);
                            self.campaigns[cid].target = keys[j];
                        }, function(e) {
                            delete self.backend.profile.data['corporate/campaigns/' + cid].shared_to[keys[j]];
                        });
                        break;
                    }
                }
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
     * Creates a new advert.
     * @function grant
     * @public
     */
    grant() {
        var self = this, cid = this.backend.generateRandomString(12);
        setImmediate(function() {
            self.dataservice.getData('corporate/address/' + self.address, true, undefined, true).then(function(data) {
                var addr = JSON.parse(data.decr_data);
                addr = JSON.parse(addr[addr.length - 1].value);
                var country = addr['generics.country'];
                addr = window.encodeURIComponent(addr['generics.postcode'] + ' ' + addr['generics.city'] + ' ' + self.translate.instant(country));
                var http = new XMLHttpRequest();
                http.open('POST', self.backend.NOMINATIM_URL + addr, true);
                http.setRequestHeader('Content-type', 'application/json');
                http.onreadystatechange = function() {
                    if(http.readyState == 4 && Math.floor(http.status/10) == 20) {
                        //End here and now
                        var res = JSON.parse(http.responseText);
                        if(res.length == 0) {
                            delete self.campaigns[cid];
                            self.notif.error(self.translate.instant('error'), self.translate.instant('advert.errAddr'));
                            return;
                        }
                        self.campaigns[cid] = {
                            radius: self.radius,
                            lat: res[0].lat,
                            lon: res[0].lon,
                            topics: self.topics,
                            until: '',
                            target: self.radius == 100000? 'whigi-advert-WORLD' : 'whigi-advert-' + country
                        };
                        self.check.tick();
                        self.redo(cid, true);
                    } else if(http.readyState == 4) {
                        delete self.campaigns[cid];
                        self.notif.error(self.translate.instant('error'), self.translate.instant('advert.error'));
                    }
                }
                http.send();
            }, function(e) {
                delete self.campaigns[cid];
                self.notif.error(self.translate.instant('error'), self.translate.instant('advert.error'));
            });
        });
    }

    /**
     * Redoes or terminates a grant.
     * @function redo
     * @public
     * @param {String} cid Campaign ID.
     * @param {Boolean} rem Remove on fail.
     */
    redo(cid: string, rem?: boolean) {
        var self = this;
        var send = JSON.stringify({
            radius: this.campaigns[cid].radius,
            lat: this.campaigns[cid].lat,
            lon: this.campaigns[cid].lon,
            topics: this.campaigns[cid].topics
        });
        //Current restrictions
        if(['whigi-advert-WORLD', 'whigi-advert-BEL'].indexOf(self.campaigns[cid].target) == -1) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('advert.limits'));
            self.check.tick();
            return;
        }
        var naes = self.backend.newAES();
        this.dataservice.newData(true, 'corporate/campaigns/' + cid, send, false, 0, true, naes).then(function(data) {
            self.dataservice.grantVault(self.campaigns[cid].target, cid, 'corporate/campaigns/' + cid, send, 0, new Date((new Date).getTime() + 30*24*60*60*1000), '', false, naes).then(function() {
                self.campaigns[cid].until = new Date((new Date).getTime() + 30*24*60*60*1000).toLocaleString(self.translate.currentLang);
                self.notif.success(self.translate.instant('success'), self.translate.instant('advert.made'));
                self.check.tick();
            }, function(e) {
                if(rem === true)
                    delete self.campaigns[cid];
                self.notif.error(self.translate.instant('error'), self.translate.instant('advert.error'));
                self.check.tick();
            });
        }, function(e) {
            if(rem === true)
                delete self.campaigns[cid];
            self.notif.error(self.translate.instant('error'), self.translate.instant('advert.error'));
            self.check.tick();
        });
    }

    /**
     * Removes a data.
     * @function remove
     * @public
     * @param {String} cid Campaign ID.
     */
    remove(cid: string) {
        var self = this;
        this.dataservice.remove('corporate/campaigns/' + cid).then(function() {
            delete self.campaigns[cid];
        }, function(e) {});
    }

}
