/**
 * Component auto login.
 * @module logginglight.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';

@Component({
    template: ''
})
export class Loginas implements OnInit {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Routing service.
     * @param routed Current route.
     * @param dataservice Data service.
     * @param auth Auth service.
     */
    constructor(public backend: Backend, public router: Router, public routed: ActivatedRoute, public dataservice: Data, public auth: Auth) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.routed.params.forEach(function(param) {
            var user = param['user'], pwd = atob(decodeURIComponent(param['pwd']));
            self.backend.createToken(user, pwd, false).then(function(ticket) {
                self.auth.switchLogin(user, ticket._id);
                self.dataservice.mPublic().then(function(profile) {
                    //Router.go...
                    self.backend.profile = profile;
                    self.dataservice.extendModules();
                    self.auth.regPuzzle(undefined, window.sha256(pwd + profile.salt), window.sha256(pwd));
                    //Last check
                    if(self.dataservice.mustChange(pwd))
                        return;

                    var ret = param['return'] || 'profile';
                    if(ret.indexOf('http') > -1) {
                        window.location.href = ret;
                    } else {
                        ret = window.decodeURIComponent(ret);
                        self.router.navigate(['/' + ret]);
                    }
                }, function(e) {
                    self.auth.deleteUid(undefined, false);
                    self.router.navigate(['/']);
                });
            }, function(e) {
                self.router.navigate(['/']);
            });
        });
    }
    
}
