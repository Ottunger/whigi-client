/**
 * Component to demand the creation of an OAuth token.
 * @module oauth.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy, ApplicationRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/oauth.html';

@Component({
    template: template
})
export class Oauth implements OnInit, OnDestroy {

    public request: string;
    public for_id: string;
    public prefix: string;
    public return_url_ok: string;
    public return_url_deny: string;
    public token: string;
    public requester: any;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param auth Auth service.
     * @param routed Activated route service.
     * @param backend Data service.
     * @param check Check service.
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService, private auth: Auth,
        private routed: ActivatedRoute, private backend: Backend, private check: ApplicationRef, private dataservice: Data) {
        this.requester = {};
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.for_id = params['for_id'].split(':')[0];
            self.request = params['for_id'].split(':')[1];
            self.token = params['token'];
            self.prefix = window.decodeURIComponent(params['prefix']);
            self.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
            self.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
            //First, check if we need to add 3rd party css
            self.dataservice.providerCSS(self.for_id);
            if(!/^https/.test(self.return_url_ok)) {
                window.location.href = self.mixin(self.return_url_deny, ['reason=https']);
            }
            if(!(self.prefix in self.backend.generics_paths)) {
                window.location.href = self.mixin(self.return_url_deny, ['reason=prefix']);
            }
            self.backend.getUser(self.for_id).then(function(user) {
                self.requester = user;
                self.dataservice.picts(user, 'pict-user');
                self.check.tick();
            }, function(e) {
                window.location.href = self.mixin(self.return_url_deny, ['reason=api']);
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
     * Adds query parameters to a URL.
     * @function mixin
     * @private
     * @param {String} url Base URL.
     * @param {String[]} params Key=Value mapping.
     * @return {String} New URL.
     */
    private mixin(url: string, params: string[]): string {
        var ps = params.join('&');
        return url + (url.indexOf('?') > 0)? '&' : '?' + ps;
    }

    /**
     * Called once the user has selected whether to accept or deny.
     * @function finish
     * @public
     * @param {Boolean} ok True if grant access.
     */
    finish(ok: boolean) {
        var self = this;
        if(ok) {
            this.backend.createOAuth(this.for_id, this.prefix, this.token).then(function(granted) {
                window.location.href = self.mixin(self.return_url_ok, ['token=' + granted._id, 'key_decryption=' + self.auth.getParams()[2]]);
            }, function(e) {
                window.location.href = self.mixin(self.return_url_deny, ['reason=api']);
            });
        } else {
            window.location.href = self.mixin(this.return_url_deny, ['reason=deny']);
        }
    }

}
