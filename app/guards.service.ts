/**
 * Service to see if user has passed requirements.
 * @module guards.service
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {Router, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Auth} from './auth.service';
import {Backend} from './app.service';
import {Data} from './data.service';
import {Filesystem} from './subcmpts/filesystem.component';
import {Dataview} from './subcmpts/dataview.component';
import {Generics} from './subcmpts/generics.component';

@Injectable()
export class Profileguard implements CanActivate, CanDeactivate<Filesystem> {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Router.
     * @param translate Translation service.
     * @param auth Auth service.
     */
    constructor(private backend: Backend, private router: Router, private translate: TranslateService, private auth: Auth) {

    }

    /**
     * Checks the guard.
     * @function canActivate
     * @public
     * @param route Actual route.
     * @param state State service.
     * @return {Boolean} Can go through.
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if(this.auth.isLoaded() && !!this.backend.profile)
            return true;
        if(!('return_url' in sessionStorage)) {
            var uri = state.url.replace(/;.*$/, '');
            sessionStorage.setItem('return_url', JSON.stringify(uri.split('/').map(window.decodeURIComponent)));
        }
        this.router.navigate(['/']);
        return false;
    }

    /**
     * Checks the guard.
     * @function canDeactivate
     * @public
     * @param component Component.
     * @param route Actual route.
     * @param state Actual state.
     * @return {Boolean} Can go through.
     */
    canDeactivate(component: Filesystem, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if(this.backend.forceMove)
            return true;
        if((!component.data_name || component.data_name.length == 0) &&
            (!component.data_value || component.data_value.length == 0)) {
            //On route change, reset the route
            component.folders = '';
            return true;
        }
        return component.dialog(this.translate.instant('confirmation'));
    }

}

@Injectable()
export class Fullguard implements CanActivate, CanDeactivate<Dataview> {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Router.
     * @param translate Translation service.
     * @param auth Auth service.
     */
    constructor(private backend: Backend, private router: Router, private translate: TranslateService, private auth: Auth) {

    }

    /**
     * Checks the guard.
     * @function canActivate
     * @public
     * @param route Actual route.
     * @param state State service.
     * @return {Boolean} Can go through.
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if(this.auth.isLoaded() && !!this.backend.profile && !!this.backend.data_loaded)
            return true;
        if(!('return_url' in sessionStorage)) {
            var uri = state.url.replace(/;.*$/, '');
            sessionStorage.setItem('return_url', JSON.stringify(uri.split('/').map(window.decodeURIComponent)));
        }
        this.router.navigate(['/profile']);
        return false;
    }

    /**
     * Checks the guard.
     * @function canDeactivate
     * @public
     * @param component Component.
     * @param route Actual route.
     * @param state Actual state.
     * @return {Boolean} Can go through.
     */
    canDeactivate(component: Dataview, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if(this.backend.forceMove)
            return true;
        if((!component.new_data || component.new_data.length == 0) &&
            (!component.new_id || component.new_id.length == 0))
            return true;
        return component.dialog(this.translate.instant('confirmation'));
    }

}

@Injectable()
export class Genguard implements CanDeactivate<Generics> {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Router.
     * @param translate Translation service.
     */
    constructor(private backend: Backend, private router: Router, private translate: TranslateService) {

    }

    /**
     * Checks the guard.
     * @function canDeactivate
     * @public
     * @param component Component.
     * @param route Actual route.
     * @param state Actual state.
     * @return {Boolean} Can go through.
     */
    canDeactivate(component: Generics, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if(this.backend.forceMove)
            return true;
        var btns = window.$('.btn-reg-gen');
        for(var i = 0; i < btns.length; i++)
            if(!window.$(btns[i]).is(':disabled'))
                return component.dialog(this.translate.instant('confirmation'));
        return true;
    }

}

@Injectable()
export class CSSguard implements CanDeactivate<Generics> {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param dataservice Data service.
     */
    constructor(private dataservice: Data) {

    }

    /**
     * Checks the guard.
     * @function canDeactivate
     * @public
     * @param component Component.
     * @param route Actual route.
     * @param state Actual state.
     * @return {Boolean} Can go through.
     */
    canDeactivate(component: any, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        this.dataservice.normalCSS();
        return true;
    }

}
