/**
 * Component displaying a reset help screen.
 * @module resethelp.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    template: ''
})
export class Resethelp implements OnInit, OnDestroy {

    private id: string;
    private data_name: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param backend Data service.
     * @param data Higher data service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private backend: Backend, private dataservice: Data) {

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
                        self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noHelp'));
                        self.router.navigate(['/generics', 'generics.profile']);
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noHelp'));
                    self.router.navigate(['/generics', 'generics.profile']);
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noHelp'));
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
