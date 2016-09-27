/**
 * Component to auth user to 3rd party.
 * @module savekey.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Data} from '../data.service';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `

    `
})
export class Remote implements OnInit, OnDestroy {

    private id_to: string;
    private challenge: string;
    private return_url: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param dataservice Data service.
     * @param backend Backend service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private dataservice: Data, private backend: Backend) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.id_to = window.decodeURIComponent(params['id_to']);
            self.challenge = params['challenge'];
            self.return_url = window.decodeURIComponent(params['return_url']);
            if(!/^https/.test(self.return_url)) {
                self.end('null', self.backend.profile._id);
            }
            self.dataservice.listData().then(function() {
                if(!!self.backend.profile.data['keys/auth/' + self.id_to]) {
                    self.backend.getData(self.backend.profile.data['keys/auth/' + self.id_to].id).then(function(data) {
                        self.backend.decryptAES(self.backend.str2arr(data.encr_data), self.dataservice.workerMgt(false, function(got) {
                            self.backend.encryptAES(self.challenge, self.dataservice.workerMgt(true, function(got) {
                                self.end(btoa(self.backend.arr2str(got)), self.backend.profile._id);
                            }), self.backend.toBytes(got));
                        }));
                    }, function(e) {
                        self.end('null', self.backend.profile._id);
                    });
                } else {
                    self.end('null', self.backend.profile._id);
                }
            }, function(e) {
                self.end('null', self.backend.profile._id);
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
        return url + ((url.indexOf('?') > 0)? '&' : '?') + ps;
    }

    /**
     * End, which is a move and maybe some calls.
     * @function End
     * @private
     * @param {String} response Response.
     * @param {String} user User.
     */
    private end(response: string, user: string) {
        if(typeof Android !== undefined) {
            try {
                Android.remote(response + ':' + user);
            } catch(e) {}
        } else if(typeof webkit !== undefined && !!webkit.messageHandlers) {
            try {
                webkit.messageHandlers.remote.postMessage(response + ':' + user);
            } catch(e) {}
        }
        window.location.href = this.mixin(this.return_url, ['response=' + response, 'user=' + user]);
    }

}
