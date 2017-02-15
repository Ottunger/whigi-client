# Standalone client
Here should lie files that make up our website, front-end site. Not the plugins for integration, but our website for users to (rarely) create an account, but most probably check and change their owned data.
We should use static html/js files described by an nginx.conf file

# To build the deps
Build the __deps from js and css; in the following order:

zone.min.js => from node_modules
Reflect.min.js
aesjs.min.js
jsencrypt.min.js
sha256.min.js
download.min.js
clipboard.min.js
jquery.min.js
moment.js
moment.locales.js
bootstrap-datetimepicker.min.js
bootstrap.min.js
jquery.blockUI.js
jquery.modal.js
intro.js

fonts.css
bootstrap.css
bootstrap-datetimepicker.min.css
components-rounded.css
simple-line-icons.min.css
layout.css
envict.min.css
login.css
whigi.css
font-awesome.min.css
jquery.modal.css
introjs.css

# In dev time
- Best practice is to launch using lite-server from node_modules/.bin after a build, in the dist directory. But be careful, as lite-server does not manage URL's with a dot (.) in them!
- In dev time, the adresses of the API are set to "192.168.1.61", those can be found in app/app.service.ts and should be changed!
- To launch, either create a small nginx.conf file, or use lite-server in node_modules/.bin, once dependencies resolved by npm.

- Modify app/app.service.ts to specify the backend hostname.
- Install npm dependencies: npm install
- Compile all : npm run aot

# Add a component
To add a component, you have to add file named yourcomponent.component.ts in app/subcmpts folder. Then create a route for it in app/app.routing.ts, load it in app/app.module.ts and don't forget to link to it from other components!
Refer to other components to see usually included services (translation, routing, backend and notifications, mostly).