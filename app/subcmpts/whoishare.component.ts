/**
 * Component displaying the files shared.
 * @module whoishare.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode} from '@angular/core';
import {Router} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
//import * as template from './templates/whoishare.html';

@Component({
    //template: template
    templateUrl: './templates/whoishare.html'
})
export class WhoIShare {

    public users: {[id: string]: any};
    public my_shares: string[];

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     */
    constructor(public backend: Backend, public router: Router,
        public notif: NotificationsService, public dataservice: Data) {
        this.users = {};
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
        if(!gen)
            return this.backend.transform('whoishare.dunno');
        if(!!this.backend.generics[gen]) {
            return help? this.backend.generics[gen][this.backend.generics[gen].length - 1].help_url : this.backend.transform(this.backend.generics[gen][this.backend.generics[gen].length - 1].descr_key);
        } else if(!!this.backend.generics[gen.replace(/\/[^\/]*$/, '')] &&
            this.backend.generics[gen.replace(/\/[^\/]*$/, '')][this.backend.generics[gen.replace(/\/[^\/]*$/, '')].length - 1].instantiable) {
            gen = gen.replace(/\/[^\/]*$/, '');
            return help? this.backend.generics[gen][this.backend.generics[gen].length - 1].help_url : this.backend.transform(this.backend.generics[gen][this.backend.generics[gen].length - 1].descr_key);
        }
        return this.backend.transform('whoishare.dunno');
    }

    /**
     * Navigate to details panel.
     * @function goTo
     * @public
     * @param {String} name Name of data.
     */
    goTo(name: string) {
        this.router.navigate(['/data', window.encodeURIComponent(name), {backuri: JSON.stringify(this.router.routerState.snapshot.url.split('/').map(window.decodeURIComponent))}]);
    }

    /**
     * Navigate to user panel.
     * @function userLink
     * @public
     * @param {String} name Name of user.
     */
    userLink(name: string) {
        this.router.navigate(['/user', name, JSON.stringify(this.router.routerState.snapshot.url.split('/').map(window.decodeURIComponent))]);
    }

    /**
     * Show real name.
     * @function realName
     * @public
     * @param {String} name Real name.
     */
    realName(name: string) {
        window.$(`
            <div class="modal">
                <h3>` + this.backend.transform('help') + `</h3>
                <p>` + name + `</p>
            </div>
        `).appendTo('body').modal();
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
        var ret = Object.getOwnPropertyNames(this.backend.my_shares).filter(function(el) {
            return self.dataservice.forDisplay(el) != self.dataservice.forDisplay(self.backend.profile._id);
        });
        ret.forEach(function(d: string) {
            self.backend.getUser(d).then(function(user) {
                self.users[d] = user;
                window.$('#pict__' + d).ready(function() {
                    if(!!user && !!user.company_info && !!user.company_info.picture)
                        window.$('#pict__' + d).attr('src', user.company_info.picture);
                    else
                        window.$('#pict__' + d).attr('src', 'assets/logo.png');
                });
            }, function(e) {
                window.$('#pict__' + d).attr('src', 'assets/logo.png');
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
        if(name.indexOf('keys/pwd/') == 0 && !window.confirm(this.backend.transform('dataview.revokeKey')))
            return;
        this.dataservice.revoke(name, shared_to_id).then(function() {
            self.dataservice.listData(false);
        }, function(e) {
            self.notif.error(self.backend.transform('error'), self.backend.transform('dataview.noRevoke'));
        });
    }
    
}
