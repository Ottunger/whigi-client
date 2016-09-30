/**
 * Component auto login.
 * @module logginglight.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
    `
})
export class Loginas implements OnInit {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Routing service.
     * @param routed Current route.
     */
    constructor(private backend: Backend, private router: Router, private routed: ActivatedRoute) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.routed.params.forEach(function(param) {
            var user = decodeURIComponent(param['user']), pwd = atob(decodeURIComponent(param['pwd']));
            self.backend.createToken(user, pwd, false).then(function(ticket) {
                localStorage.setItem('token', ticket._id);
                self.backend.getProfile().then(function(profile) {
                    //Router.go...
                    self.backend.profile = profile;
                    localStorage.setItem('key_decryption', window.sha256(pwd + profile.salt));
                    localStorage.setItem('psha', window.sha256(pwd));

                    var ret = param['return'];
                    if(ret.indexOf('http') > -1) {
                        window.location.href = ret;
                    } else {
                        self.router.navigate(['/' + ret]);
                    }
                }, function(e) {
                    localStorage.removeItem('token');
                    self.router.navigate(['/']);
                });
            }, function(e) {
                self.router.navigate(['/']);
            });
        });
    }
    
}
