/**
 * Component displaying a detailed view of a vault.
 * @module vaultview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/vaultview.html';

@Component({
    template: template
})
export class Vaultview implements OnInit, OnDestroy {

    public vault: any;
    public sharer_id: string;
    public decr_data: string;
    public is_dated: boolean;
    public is_generic: boolean;
    public version: number;
    public gen_name: string;
    private route_back: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     * @param backend API service.
     * @param notif Notifications service.
     * @param routed Parameters service.
     * @param dataservice Data service.
     */
    constructor(private router: Router, private backend: Backend,
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data) {
        this.vault = {data_name: '', real_name: ''};
        this.decr_data = '';
        this.is_generic = false;
        this.version = 0;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.route_back = params['route_back'];
            self.sharer_id = params['username'];
            self.dataservice.getVault(params['id']).then(function(vault) {
                self.vault = vault;
                self.decr_data = vault.decr_data;
                self.is_dated = vault.is_dated;
                if(!!self.backend.generics[vault.real_name] && !self.backend.generics[vault.real_name][self.backend.generics[vault.real_name].length - 1].share_as_folder) {
                    self.is_generic = true;
                    self.version = vault.version;
                    self.gen_name = vault.real_name;
                } else if(!!self.backend.generics[vault.real_name.replace(/\/[^\/]+$/, '')]) {
                    self.is_generic = true;
                    self.version = vault.version;
                    self.gen_name = vault.real_name.replace(/\/[^\/]+$/, '');
                }
                //Breadcrump
                window.$('#breadcrump').ready(function() {
                    if(!!params['data_name'])
                        self.dataservice.ev.emit([params['data_name'], false]);
                    else
                        self.dataservice.ev.emit([self.sharer_id + '/' + self.vault.data_name, false]);
                });
            }, function(e) {
                if(e.status == 417)
                    self.notif.error(self.backend.transform('error'), self.backend.transform('vaultview.expired'));
                else
                    self.notif.error(self.backend.transform('error'), self.backend.transform('vaultview.noData'));
                delete self.backend.profile.shared_with_me[self.sharer_id][params['data_name']];
                self.back();
            });
        });
    }

    /**
     * Called upon destroy.
     * @function ngOnInit
     * @public
     */
    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    /**
     * Back to profile.
     * @function back
     * @public
     */
    back() {
        this.router.navigate(['/filesystem', 'vault', (!!this.route_back)? {folders: this.route_back} : {}]);
    }
    
}
