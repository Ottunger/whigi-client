/**
 * Component displaying an error screen.
 * @module logging.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component, enableProdMode} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
enableProdMode();
import * as template from './templates/notfound.html';

@Component({
    template: template
})
export class Notfound {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     */
    constructor(private translate: TranslateService) {
        
    }
    
}
