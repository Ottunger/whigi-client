/**
 * Component to display the breadcrump.
 * @module breadcrump.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, OnChanges, OnDestroy, Renderer} from '@angular/core';
import {Router} from '@angular/router';
enableProdMode();
import * as template from './templates/breadcrump.html';

@Component({
    selector: 'breadcrump',
    template: template
})
export class Breadcrump implements OnChanges, OnDestroy {

    @Input() name: string;
    @Input() folder: boolean;
    private renderFunc: Function;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param render Rendering service.
     * @param router Routing service.
     */
    constructor(private render: Renderer, private router: Router) {

    }

    /**
     * Called upon display.
     * @function ngOnChanges
     * @public
     */
    ngOnChanges(e: {[id: string]: any}): void {
        var self = this;
        if('name' in e) {
            self.name = e['name'].currentValue;
        }
        if('folder' in e) {
            self.folder = e['folder'].currentValue;
        }
        window.$('#breadcrump').ready(function() {
            window.$('#breadcrump').html(self.sanitarize(self.name, self.folder));
        });
        self.renderFunc = self.render.listenGlobal('body', 'click', function(event) {
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
        if(!!this.renderFunc)
            this.renderFunc();
    }

    /**
     * Return the structure directory of a data.
     * @function sanitarize
     * @public
     * @param {String} name Name of data.
     * @param {Boolean} folder If folder, not display end separator.
     * @return {String} HTML.
     */
    private sanitarize(name: string, folder: boolean) {
        var parts: string[] = name.split('/');
        parts.unshift('<button type="button" class="btn btn-lg btn-link bread-home"><i class="fa fa-home bread-home"></i></button>');
        var last = parts.pop();

        var folders = '';
        for(var i = 1; i < parts.length; i++) {
            folders += parts[i] + '/';
            parts[i] = '<button type="button" class="btn btn-lg btn-link bread-in" data-link="' + folders + '">' + parts[i] + '</button>'
        }
        return parts.join(' > ') + (folder? '' : (' >> <button type="button" class="btn btn-lg btn-link">' + last + '</button>'));
    }

}
