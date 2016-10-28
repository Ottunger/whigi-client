/**
 * Loading for delegated services and bootstraping of components.
 * @module app.module
 * @author Mathonet Grégoire
 */

'use strict';
import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from 'ng2-translate/ng2-translate';
import {SimpleNotificationsModule} from 'angular2-notifications';
import {routing, appRoutingProviders} from './app.routing';

import {Backend} from './app.service';
import {Data} from './data.service';
import {Profileguard, Fullguard, Genguard} from './guards.service';

import {Application} from './app.component';
import {Logging} from './subcmpts/logging.component';
import {Profile} from './subcmpts/profile.component';
import {Dataview} from './subcmpts/dataview.component';
import {Vaultview} from './subcmpts/vaultview.component';
import {Reset} from './subcmpts/reset.component';
import {Savekey} from './subcmpts/savekey.component';
import {Filesystem} from './subcmpts/filesystem.component';
import {Oauth} from './subcmpts/oauth.component';
import {Resethelp} from './subcmpts/resethelp.component';
import {Userinfo} from './subcmpts/userinfo.component';
import {Account} from './subcmpts/account.component';
import {Remote} from './subcmpts/remote.component';
import {Generics} from './subcmpts/generics.component';
import {Clearview} from './subcmpts/clearview.component';
import {User} from './subcmpts/user.component';
import {Merge} from './subcmpts/merge.component';
import {Loginas} from './subcmpts/loginas.component';
import {Sidebar} from './subcmpts/sidebar.component';
import {Header} from './subcmpts/header.component';
import {GenericBlock} from './subcmpts/generic_block.component';
import {WhoIShare} from './subcmpts/whoishare.component';
import {InputBlock} from './subcmpts/input_block.component';
import {Tooltip} from './subcmpts/tooltip.component';
import {Breadcrump} from './subcmpts/breadcrump.component';
import {Notfound} from './subcmpts/notfound.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        TranslateModule.forRoot(),
        SimpleNotificationsModule,
        routing
    ],
    declarations: [
        Application,
        Logging,
        Profile,
        Dataview,
        Vaultview,
        Reset,
        Savekey,
        Filesystem,
        Oauth,
        Resethelp,
        Userinfo,
        Account,
        Remote,
        Generics,
        Clearview,
        User,
        Merge,
        Loginas,
        Sidebar,
        Header,
        GenericBlock,
        WhoIShare,
        InputBlock,
        Tooltip,
        Breadcrump,
        Notfound
    ],
    providers: [
        appRoutingProviders,
        Backend,
        Data,
        Profileguard,
        Fullguard,
        Genguard
    ],
    bootstrap: [Application]
})
export class AppModule {



}