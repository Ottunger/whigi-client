/**
 * Component displaying public info about a user.
 * @module vaultview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';

@Component({
    templateUrl: './templates/user.html'
})
export class User implements OnInit, OnDestroy {

    public user: any;
    public id: string;
    public ret: string[];
    public sub: Subscription;
    public ready: EventEmitter<any>;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     * @param backend API service.
     * @param notif Notifications service.
     * @param routed Parameters service.
     */
    constructor(public router: Router, public backend: Backend,
        public notif: NotificationsService, public routed: ActivatedRoute) {
        this.user = {};
        this.ready = new EventEmitter<any>();
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.id = params['id'];
            self.ret = !!params['ret']? JSON.parse(window.decodeURIComponent(params['ret'])) : ['/profile'];
            self.backend.getUser(self.id).then(function(user) {
                self.user = user;
                self.ready.emit(user);
            }, function(e) {
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
        this.router.navigate(this.ret);
    }
    
}
