/**
 * Component displaying public info about a user.
 * @module vaultview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
enableProdMode();
import * as template from './templates/user.html';

@Component({
    template: template
})
export class User implements OnInit, OnDestroy {

    public user: any;
    public id: string;
    public ret: string[];
    private sub: Subscription;
    private ready: EventEmitter<any>;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param backend API service.
     * @param notif Notifications service.
     * @param routed Parameters service.
     */
    constructor(private translate: TranslateService, private router: Router, private backend: Backend,
        private notif: NotificationsService, private routed: ActivatedRoute) {
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
