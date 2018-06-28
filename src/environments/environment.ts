// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  api: 'https://dnd-buddy.herokuapp.com/api/', //'https://dnd-buddy.herokuapp.com/api/', //'http://localhost:49950/api/'
  dnd_api: 'https://dnd-5e-api.herokuapp.com/api/',
  message_api: 'http://localhost:49950///' //https://dnd-buddy.herokuapp.com/'
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
