/**
 * Component displaying the files shared.
 * @module whoishare.component
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
import * as template from './templates/whoishare.html';

@Component({
    template: template
})
export class WhoIShare implements OnInit {

    private my_shares: string[];

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router,
        private notif: NotificationsService, private dataservice: Data) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        
    }

    /**
     * Tries to get name of generic.
     * @function genName
     * @public
     * @param {String} gen Key.
     * @param {Boolean} help True to get help url.
     * @return {String} Translation.
     */
    genName(gen: string, help: boolean): string {
        if(!!this.backend.generics[gen]) {
            return help? this.backend.generics[gen][this.backend.generics[gen].length - 1].help_url : this.translate.instant(this.backend.generics[gen][this.backend.generics[gen].length - 1].descr_key);
        } else if(!!this.backend.generics[gen.replace(/\/[^\/]*$/, '')] &&
            this.backend.generics[gen.replace(/\/[^\/]*$/, '')][this.backend.generics[gen.replace(/\/[^\/]*$/, '')].length - 1].instantiable) {
            gen = gen.replace(/\/[^\/]*$/, '');
            return help? this.backend.generics[gen][this.backend.generics[gen].length - 1].help_url : this.translate.instant(this.backend.generics[gen][this.backend.generics[gen].length - 1].descr_key);
        }
        return '';
    }

    /**
     * Navigate to details panel.
     * @function goTo
     * @public
     * @param {String} name Name of data.
     */
    goTo(name: string) {
        this.router.navigate(['/data', window.encodeURIComponent(name)]);
    }

    /**
     * Keys.
     * @function regables
     * @public
     * @return {String[]} Keys.
     */
    regables(): string[] {
        var self = this;
        if(!this.backend.my_shares)
            return [];
        if(this.my_shares)
            return this.my_shares;
        var ret = Object.getOwnPropertyNames(this.backend.my_shares);
        ret.forEach(function(d: string) {
            window.$('#pict__' + d).ready(function() {
                self.backend.getUser(d).then(function(user) {
                    if(!!user && !!user.company_info && !!user.company_info.picture)
                        window.$('#pict__' + d).attr('src', user.company_info.picture);
                    else
                        window.$('#pict__' + d).attr('src', 'assets/logo.png');
                }, function(e) {
                    window.$('#pict__' + d).attr('src', 'assets/logo.png');
                });
            });
        });
        this.my_shares = ret;
        return ret;
    }

    /**
     * Revoke an access.
     * @function revoke
     * @public
     * @param {String} name Data name.
     * @param {String} shared_to_id Id of sharee.
     */
    revoke(name: string, shared_to_id: string) {
        var self = this;
        if(name.indexOf('keys/pwd/') == 0 && !window.confirm(this.translate.instant('dataview.revokeKey')))
            return;
        this.backend.revokeVault(this.backend.profile.data[name].shared_to[shared_to_id]).then(function() {
            delete self.backend.profile.data[name].shared_to[shared_to_id];
            var i = self.backend.my_shares[shared_to_id].indexOf(name);
            delete self.backend.my_shares[shared_to_id][i];
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
        });
    }
    
}
