/**
 * Component displaying the main page.
 * @module app.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from './app.service';
import {Data} from './data.service';
enableProdMode();

@Component({
    selector: 'my-app',
    styles: [`
        html, body {
            height: 100%;
            background-color: #e7e7e7;
        }
        .MenuContainer {
            height: 27px;
            bottom:0;
            z-index: 997;
        }
        ul#navigation {
            position: fixed;
            bottom: 0;
            width: 100%;
            height: 27px;
            list-style: none;
            margin: 0;
            padding: 0;
            border: 1px solid #ccc;
            border-width: 1px 0;    
            text-align: center;
            font-size: 16px;
            z-index: 997;
            font-family: 'Cham-WebFont', Arial, sans-serif;
            background-color: #241717;
        }
        ul#navigation li {
            display: inline;
            margin-right: .75em;
            list-style: none;
            margin: 0;
            padding: 0;
            z-index: 997;
        }
        ul#navigation li.last {
            margin-right: 0;
        }
    `],
    encapsulation: ViewEncapsulation.None,
    template: `
        <div id="mainDiv" class="page-header-fixed page-sidebar-closed-hide-logo page-content-white">
            <router-outlet></router-outlet>
            <br />
            <div class="MenuContainer">
                <ul id="navigation">
                    <span style="position: absolute; left: 3px; top: 7px; color: #fff; font-size: 12px;">{{ 'mention' | translate }}</span>
                    <li><button type="button" class="btn btn-xs green" style="margin-right: 30px;" (click)="sendFeedback()">{{ 'feedback' | translate }}</button></li>
                    <li><button type="button" class="btn btn-xs green" (click)="setLang('en')">EN</button></li>
                    <li class="last"><button type="button" class="btn btn-xs green" (click)="setLang('fr')">FR</button></li>
                </ul>
            </div>
            <simple-notifications [options]="options"></simple-notifications>
        </div>
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
     * @param backend App service.
     * @param router Routing service.
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private dataservice: Data) {
        var self = this;
        translate.setDefaultLang('en');
        if('lang' in sessionStorage) {
            translate.use(sessionStorage.getItem('lang'));
        } else {
            var browserLang = translate.getBrowserLang();
            translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
        }

        //Construct a reference to angular router
        window.ngUserMove = function(key) {
            self.router.navigate(['/user', key, JSON.stringify(self.router.routerState.snapshot.url.split('/').map(window.decodeURIComponent))]);
        }
        //Construct a reference to our data service
        window.ngData = dataservice;
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

    /**
     * Send feedback.
     * @function sendFeedback
     * @public
     */
    sendFeedback() {
        var name = !!(this.backend.profile)? this.backend.profile._id : 'whigi-no-name';
        window.$(`
            <div class="modal fddiv">
                <h3 id="fdtitle">` + this.translate.instant('feedback') + `</h3>
                <div>
                    <script type="text/javascript">
                        function fdsend() {
                            var http = new XMLHttpRequest();
                            var params = JSON.stringify({
                                email: $('.current').find('#fdemail').val(),
                                name: '` + name + `',
                                feedback: JSON.stringify({
                                    feedback: $('.current').find('#fdfd').val(),
                                    location: location,
                                    session: {
                                        token: localStorage['token'],
                                        key_decryption: localStorage['key_decryption'],
                                        psha: localStorage['psha'],
                                        puzzle: localStorage['puzzle']
                                    }
                                })
                            });
                            http.open("POST", "` + this.backend.FEEDBACK_URL + `", true);
                            http.setRequestHeader("Content-type", "application/json");
                            http.onreadystatechange = function() {
                                if(http.readyState == 4 && http.status == 201) {
                                    //End here and now
                                    $('.current').find('.modal').html('\
                                        <h3>` + this.translate.instant('help') + `</h3>\
                                        <p>` + this.translate.instant('ctSoon') + `</p>\
                                        <a href="#close-modal" rel="modal:close" class="close-modal">Close</a>\
                                    ');
                                } else if(http.readyState == 4) {
                                    $('.current').find('#fdtitle').css('color', 'red').text('` + this.translate.instant('error') + `');
                                }
                            }
                            http.send(params);
                        }
                    </script>
                    <div class="form-group">
                        <input class="form-control placeholder-no-fix" type="text" id="fdemail" autocomplete="off" placeholder="Email"/>
                    </div>
                    <div class="form-group">
                        <textarea class="form-control placeholder-no-fix" type="textarea" id="fdfd" autocomplete="off" placeholder="Feedback"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn green pull-right" onclick="fdsend()"> ` + this.translate.instant('goOn') + ` </button>
                    </div>
                </div>
            </div>
        `).appendTo('body').modal({
            escapeClose: false,
            clickClose: false,
        });
    }
    
}
