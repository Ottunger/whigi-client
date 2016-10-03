/**
 * Component displaying the main page.
 * @module app.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, ViewEncapsulation} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
enableProdMode();

@Component({
    selector: 'my-app',
    styles: [`
        html, body {
            height: 100%;
            background-color: #a0b4c9;
        }
        .MenuContainer {
            height: 40px;
            bottom:0;
        }
        ul#navigation {
            position: fixed;
            bottom: 0;
            width: 100%;
            height: 40px;
            list-style: none;
            margin: 0;
            padding: 0;
            border: 1px solid #ccc;
            border-width: 1px 0;    
            text-align: center;
            font-size: 22px;
            font-family: 'Cham-WebFont', Arial, sans-serif;
        }
        ul#navigation li {
            display: inline;
            margin-right: .75em;
            list-style: none;
            margin: 0;
            padding: 0;
        }
        ul#navigation li.last {
            margin-right: 0;
        }
    `],
    encapsulation: ViewEncapsulation.None,
    template: `
        <div class="container-fluid">
            <router-outlet></router-outlet>
        </div>
        <br /><br />
        <div class="MenuContainer">
            <ul id="navigation">
                <li><button type="button" class="btn btn-small" (click)="setLang('en')">English</button></li>
                <li class="last"><button type="button" class="btn btn-small" (click)="setLang('fr')">Français</button></li>
            </ul>
        </div> 
        <simple-notifications [options]="options"></simple-notifications>
    `
})
export class Application {

    public options = {
        timeOut: 4000,
        lastOnBottom: true,
        clickToClose: true,
        maxLength: 0,
        maxStack: 4,
        showProgressBar: true,
        pauseOnHover: true,
        preventDuplicates: false,
        preventLastDuplicates: "visible",
        rtl: false,
        animate: "scale",
        position: ["right", "bottom"]
    };

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     */
    constructor(private translate: TranslateService) {
        //Load translations on the fly
        //translate.addLangs(['en', 'fr']);
        translate.setDefaultLang('en');

        if('lang' in sessionStorage) {
            translate.use(sessionStorage.getItem('lang'));
        } else {
            var browserLang = translate.getBrowserLang();
            translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
        }
    }

    /**
     * Changes the language for the app.
     * @function setLang
     * @public
     * @param {String} lang New language.
     */
    setLang(lang: string) {
        sessionStorage.setItem('lang', lang);
        this.translate.use(lang);
    }
    
}
