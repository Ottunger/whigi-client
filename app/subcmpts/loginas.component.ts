/**
 * Component auto login.
 * @module logginglight.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

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
    constructor(private backend: Backend, private router: Router, private routed: ActivatedRoute, private dataservice: Data, private auth: Auth) {

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

                    var ret = param['return'];
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
