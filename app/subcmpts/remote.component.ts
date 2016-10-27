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
    template: ''
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
            self.id_to = params['id_to'];
            self.challenge = params['challenge'];
            self.return_url = window.decodeURIComponent(params['return_url']);
            if(!/^https/.test(self.return_url)) {
                self.end('null', 'null', self.backend.profile._id, self.backend.profile.hidden_id);
            }
            self.dataservice.listData(false).then(function() {
                if(!!self.backend.profile.data['keys/auth/' + self.id_to]) {
                    self.dataservice.getData(self.backend.profile.data['keys/auth/' + self.id_to].id).then(function(data) {
                        self.backend.encryptAES(self.challenge, self.dataservice.workerMgt(true, function(got) {
                            var send = got.map(function(el) { return el + ''; }).join('-');
                            self.end(send, window.btoa(self.backend.arr2str(got)), self.backend.profile._id, self.backend.profile.hidden_id);
                        }), self.backend.toBytes(data.decr_data));
                    }, function(e) {
                        self.end('null', 'null', self.backend.profile._id, self.backend.profile.hidden_id);
                    });
                } else {
                    self.end('null', 'null', self.backend.profile._id, self.backend.profile.hidden_id);
                }
            }, function(e) {
                self.end('null', 'null', self.backend.profile._id, self.backend.profile.hidden_id);
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
     * @param {String} r64 Response b64.
     * @param {String} user User.
     * @param {String} hidden_id Hidden unique ID.
     */
    private end(response: string, r64: string, user: string, hidden_id: string) {
        if(typeof Android !== undefined) {
            try {
                Android.remote(r64 + ':' + user.toLowerCase() + ':' + hidden_id);
            } catch(e) {}
        } else if(typeof webkit !== undefined && !!webkit.messageHandlers) {
            try {
                webkit.messageHandlers.remote.postMessage(r64 + ':' + user.toLowerCase() + ':' + hidden_id);
            } catch(e) {}
        }
        window.location.href = this.mixin(this.return_url, ['response=' + response, 'r64=' + r64, 'user=' + user.toLowerCase(), 'hidden_id=' + hidden_id]);
    }

}
