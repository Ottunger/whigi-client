/**
 * Component managing permissions.
 * @module oauths.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
//import * as template from './templates/oauths.html';

@Component({
    //template: template
    templateUrl: './templates/oauths.html'
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
     * @param notif Notification service.
     * @param backend Backend service.
     * @param router Router service.
     * @param dataservice Data service.
     * @param authing Auth service.
     */
    constructor(public notif: NotificationsService, public backend: Backend,
        public router: Router, public dataservice: Data, public authing: Auth) {
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
        var self = this;
        return this.backend.data_trie.suggestions('').filter(function(el: string): boolean {
            return el.charAt(el.length - 1) == '/' && !(el.substr(0, el.length - 1) in self.backend.generics);
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
            self.backend.getUser(ong).then(function(user) {
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
        Data.grant(this);
    }

    /**
     * Reload client with new user.
     * @function loginas
     * @public
     * @param {String} ong Name.
     */
    loginas(ong: string) {
        var self = this;
        if(window.confirm(this.backend.transform('profile.loginassure'))) {
            this.dataservice.getVault(this.backend.profile.shared_with_me[ong]['oauth']).then(function(vault) {
                //Data
                var obj = JSON.parse(vault.decr_data);
                //Logout
                self.backend.forceReload();
                delete self.backend.profile;
                //And login as
                self.authing.switchLogin(ong, obj.token);
                self.dataservice.mPublic().then(function(profile) {
                    //Router.go...
                    self.backend.profile = profile;
                    self.dataservice.extendModules();
                    self.authing.regPuzzle(undefined, obj.key_decryption, obj.psha);
                    profile.company_info.is_company? self.router.navigate(['/filesystem', 'data']) : self.router.navigate(['/generics']);
                }, function(e) {
                    self.authing.deleteUid(undefined, false);
                    self.router.navigate(['/']);
                    self.notif.error(self.backend.transform('error'), self.backend.transform('profile.noGet'));
                });
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('profile.noGet'));
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
            self.notif.error(self.backend.transform('error'), self.backend.transform('profile.noRevoke'));
        });
        function complete() {
            self.backend.removeData('oauths/' + for_id);
            delete self.backend.profile.data['oauths/' + for_id];
        }
        if(('oauths/' + for_id) in this.backend.profile.data) {
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
