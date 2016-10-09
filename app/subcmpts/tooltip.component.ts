/**
 * Component to display a tooltip.
 * @module tooltip.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
enableProdMode();
import * as template from './templates/tooltip.html';

@Component({
    selector: 'tooltip',
    template: template
})
export class Tooltip {

    @Input() uri: string;
    @Input() right: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param translate I18N service.
     * @param notif Event service.
     */
    constructor(private backend: Backend, private translate: TranslateService, private notif: NotificationsService) {

    }

    ngOnChanges(e) {
        console.log(e);
    }

    /**
     * Launch.
     * @function Launch
     * @public
     */
    launch() {
        var self = this;
        if(!self.uri || self.uri == '')
            return;
        self.backend.tooltip(self.uri).then(function(vals) {
            window.$(`
                <div class="modal">
                    <h3>` + self.translate.instant('help') + `</h3>
                    <p>` + vals[self.translate.currentLang] + `</p>
                </div>
            `).appendTo('body').modal();
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('help.noHelp'));
        });
    }

}
