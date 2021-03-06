/**
 * Component displaying a reset help screen.
 * @module resethelp.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';

@Component({
    template: ''
})
export class Resethelp implements OnInit, OnDestroy {

    public id: string;
    public data_name: string;
    public sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param backend Data service.
     * @param data Higher data service.
     */
    constructor(public router: Router, public notif: NotificationsService,
        public routed: ActivatedRoute, public backend: Backend, public dataservice: Data) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.id = params['id'].toLowerCase();
            self.data_name = window.decodeURIComponent(params['data_name']);
            self.dataservice.listData(false).then(function() {
                self.dataservice.getVault(self.backend.profile.shared_with_me[self.id][self.data_name]).then(function(vault) {
                    self.backend.mixRestore(self.id, vault.decr_data).then(function() {
                        self.router.navigate(['/generics', 'generics.profile']);
                    }, function() {
                        self.notif.error(self.backend.transform('error'), self.backend.transform('reset.noHelp'));
                        self.router.navigate(['/generics', 'generics.profile']);
                    });
                }, function(e) {
                    self.notif.error(self.backend.transform('error'), self.backend.transform('reset.noHelp'));
                    self.router.navigate(['/generics', 'generics.profile']);
                });
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('reset.noHelp'));
                self.router.navigate(['/generics', 'generics.profile']);
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

}
