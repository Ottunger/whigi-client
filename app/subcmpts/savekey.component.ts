/**
 * Component register a key then moving to profile.
 * @module savekey.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Subscription} from 'rxjs/Subscription';
import {Data} from '../data.service';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: ''
})
export class Savekey implements OnInit, OnDestroy {

    public key: string;
    public value: string;
    public return_url: string;
    public sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param dataservice Data service.
     * @param backend App service.
     */
    constructor(public router: Router, public notif: NotificationsService,
        public routed: ActivatedRoute, public dataservice: Data, public backend: Backend) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.key = window.decodeURIComponent(params['key']);
            self.value = window.decodeURIComponent(params['value']);
            self.return_url = window.decodeURIComponent(params['return_url']);
            if(self.key in self.backend.generics || (self.key.replace(/\/[^\/]*/, '') in self.backend.generics &&
                self.backend.generics[self.key.replace(/\/[^\/]*/, '')][self.backend.generics[self.key.replace(/\/[^\/]*/, '')].length - 1].instantiable))
                window.location.href = self.return_url;
            //Now try!
            self.dataservice.newData(true, self.key, self.value, params['is_dated'] == 'true', 0, false).then(function() {
                self.notif.success(self.backend.transform('success'), self.backend.transform('savekey.rec'));
                setTimeout(function() {
                    window.location.href = self.return_url;
                }, 1500);
            }, function(err) {
                if(err[0] == 'exists') {
                    if(window.confirm(self.backend.transform('savekey.erase'))) {
                        self.dataservice.newData(true, self.key, self.value, params['is_dated'] == 'true', 0, true).then(function() {
                            self.notif.success(self.backend.transform('success'), self.backend.transform('savekey.rec'));
                            setTimeout(function() {
                                window.location.href = self.return_url;
                            }, 1500);
                        }, function(err) {
                            self.notif.error(self.backend.transform('error'), self.backend.transform('server'));
                            setTimeout(function() {
                                window.location.href = self.return_url;
                            }, 1500);
                        });
                    } else {
                        window.location.href = self.return_url;
                    }
                } else {
                    self.notif.error(self.backend.transform('error'), self.backend.transform('server'));
                    setTimeout(function() {
                        window.location.href = self.return_url;
                    }, 1500);
                }
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
