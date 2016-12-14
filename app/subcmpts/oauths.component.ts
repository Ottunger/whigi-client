/**
 * Component managing permissions.
 * @module oauths.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/oauths.html';

@Component({
    template: template
})
export class Oauths implements OnInit {

    public ongs: string[];
    public auth: string;
    public prefix: string;
    public admin: boolean;
    public usernames: {[id: string]: string};

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend Backend service.
     * @param router Router service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend,
        private router: Router, private dataservice: Data) {
        this.admin = false;
        this.usernames = {};
    }

    /**
     * Choices of folders.
     * @function choices
     * @public
     * @return {String[]} Choices.
     */
    choices(): string[] {
        return this.backend.data_trie.suggestions('').filter(function(el: string): boolean {
            return el.charAt(el.length - 1) == '/';
        }).map(function(el: string): string {
            return el.substr(0, el.length - 1); 
        });;
    }

    /**
     * Called upon displaying.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.ongs = this.backend.shared_with_me_trie.suggestions('', '/').filter(function(el: string): boolean {
            return self.backend.shared_with_me_trie.has(el + 'oauth');
        }).map(function(el: string): string {
            return el.substr(0, el.length - 1);
        });
        this.ongs.forEach(function(ong) {
            this.backend.getUser(ong).then(function(user) {
                if(!!user.company_info && !!user.company_info.name)
                    self.usernames[ong] = user.company_info.name;
            }, function(e) {});
        });
    }

    /**
     * Grant a new ticket.
     * @function grant
     * @public
     */
    grant() {
        var self = this;
        for(var i = 0; i < self.backend.profile.oauth.length; i++) {
            if(self.backend.profile.oauth[i].for_id == this.auth.toLowerCase()) {
                this.auth = '';
                this.prefix = '';
                this.notif.success(this.translate.instant('success'), this.translate.instant('oauth.granted'));
                return;
            }
        }
        this.backend.peekUser(this.auth).then(function() {
            self.auth = self.auth.toLowerCase();
            if(!/\/$/.test(self.prefix))
                self.prefix += '/';
            self.backend.createOAuth(self.auth, self.prefix, undefined, self.admin).then(function(ticket) {
                self.backend.profile.oauth.push({id: ticket._id, for_id: self.auth.toLowerCase(), prefix: self.prefix})
                var obj = JSON.stringify({
                    token: ticket._id,
                    key_decryption: localStorage.getItem('key_decryption'),
                    psha: localStorage.getItem('psha')
                });
                function complete(naes: number[], toGrant: boolean) {
                    self.dataservice.newData(true, 'oauths/' + self.auth, obj, false, 0, true, naes).then(function() {
                        if(toGrant) {
                            self.dataservice.grantVault(self.auth, 'oauth', 'oauths/' + self.auth, obj, 0, new Date(0), '', false, naes).then(function() {
                                self.auth = '';
                                self.prefix = '';
                                self.notif.success(self.translate.instant('success'), self.translate.instant('oauth.granted'));
                            }, function(e) {
                                self.notif.error(self.translate.instant('error'), self.translate.instant('oauth.noGrant'));
                            });
                        } else {
                            self.auth = '';
                            self.prefix = '';
                            self.notif.success(self.translate.instant('success'), self.translate.instant('oauth.granted'));
                        }
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('oauth.noGrant'));
                    });
                }

                //Check if object existed
                if(('oauths/' + self.auth) in self.backend.profile.data) {
                    self.dataservice.getData('oauths/' + self.auth, false, undefined, true).then(function(data) {
                        complete(data.decr_aes, false);
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('oauth.noGrant'));
                    });
                } else {
                    complete(self.backend.newAES(), true);
                }
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('oauth.noGrant'));
            });
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.noUser'));
        });
    }

    /**
     * Reload client with new user.
     * @function loginas
     * @public
     * @param {String} ong Name.
     */
    loginas(ong: string) {
        var self = this;
        if(window.confirm(this.translate.instant('profile.loginassure'))) {
            this.dataservice.getVault(this.backend.profile.shared_with_me[ong]['oauth']).then(function(vault) {
                //Data
                var obj = JSON.parse(vault.decr_data);
                //Logout
                self.backend.forceReload();
                delete self.backend.profile;
                //And login as
                localStorage.setItem('token', obj.token);
                self.dataservice.mPublic().then(function(profile) {
                    //Router.go...
                    self.backend.profile = profile;
                    self.dataservice.extendModules();
                    localStorage.setItem('key_decryption', obj.key_decryption);
                    localStorage.setItem('psha', obj.psha);
                    self.router.navigate(['/filesystem', 'data']);
                }, function(e) {
                    localStorage.removeItem('token');
                    self.router.navigate(['/llight']);
                    self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noGet'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noGet'));
            });
        }
    }

    /**
     * Remove a granted OAuth token.
     * @function remove
     * @public
     * @param {String} id Token id.
     * @param {String} for_id Granted user.
     */
    remove(id: string, for_id: string) {
        var self = this;
        this.backend.removeOAuth(id).then(function() {
            for(var i = 0; i < self.backend.profile.oauth.length; i++) {
                if(self.backend.profile.oauth[i].id == id) {
                    self.backend.profile.oauth.splice(i, 1);
                    break;
                }
            }
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noRevoke'));
        });
        if(('oauths/' + for_id) in this.backend.profile.data) {
            function complete() {
                self.backend.removeData('oauths/' + for_id);
                delete self.backend.profile.data['oauths/' + for_id];
            }
            //Check if given
            if(for_id in self.backend.profile.data['oauths/' + for_id].shared_to) {
                self.backend.revokeVault(self.backend.profile.data['oauths/' + for_id].shared_to[for_id]).then(function() {
                    complete();
                }, function(e) {
                    complete();
                });
            } else {
                complete();
            }
        }
    }

}
