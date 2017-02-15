/**
 * Component to display the breadcrump.
 * @module breadcrump.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, OnInit, OnDestroy, Renderer, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
enableProdMode();
//import * as template from './templates/breadcrump.html';

@Component({
    selector: 'breadcrump',
    //template: template
    templateUrl: './templates/breadcrump.html'
})
export class Breadcrump implements OnInit, OnDestroy {

    public name: string;
    public folder: boolean;
    @Input() ev: EventEmitter<[string, boolean]>;
    public renderFunc: Function;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param render Rendering service.
     * @param router Routing service.
     */
    constructor(public render: Renderer, public router: Router) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.ev.asObservable().subscribe(function(vals) {
            self.name = vals[0];
            self.folder = vals[1];
            window.$('#breadcrump').ready(function() {
                window.$('#breadcrump').html(self.sanitarize());
            });
        });
        this.renderFunc = this.render.listenGlobal('body', 'click', function(event) {
            var mode = /^\/(filesystem\/)?data/.test(window.location.pathname)? 'data' : 'vault';
            if(window.$(event.target).hasClass('bread-home')) {
                self.router.navigate(['/filesystem', mode]);
            } else if(window.$(event.target).hasClass('bread-in')) {
                self.router.navigate(['/filesystem', mode, {folders: window.$(event.target).attr('data-link')}]);
            }
        });
    }

    /**
     * Called upon destroy.
     * @function ngOnDestroy
     * @public
     */
    ngOnDestroy(): void {
        this.renderFunc();
    }

    /**
     * Return the structure directory of a data.
     * @function sanitarize
     * @public
     * @return {String} HTML.
     */
    private sanitarize() {
        var parts: string[] = this.name.split('/');
        parts.unshift('<button type="button" class="btn btn-lg btn-link bread-home"><i class="fa fa-home bread-home"></i></button>');
        var last = parts.pop();

        var folders = '';
        for(var i = 1; i < parts.length; i++) {
            folders += parts[i] + '/';
            parts[i] = '<button type="button" class="btn btn-lg btn-link bread-in" data-link="' + folders + '">' + parts[i] + '</button>'
        }
        return parts.join(' > ') + (this.folder? '' : (' >> <button type="button" class="btn btn-lg btn-link">' + last + '</button>'));
    }

}
