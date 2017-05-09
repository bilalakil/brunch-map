const functions = require('firebase-functions'),
      admin = require('firebase-admin'),

      maps = require('@google/maps').createClient({
        key: functions.config().googlemaps.key,
        Promise: require('q').Promise,
      })

admin.initializeApp(functions.config().firebase)

exports.setLatLng =
  functions.database.ref('/users/{uid}/brunchSpots/{spot}/address')
    .onWrite(event => {
      if(!event.data.exists()) { return; }

      const position = event.data.ref.parent.child('position'),
            errVal   = { lat: null, lng: null, error: true }

      return maps.geocode({ address: event.data.val() })
        .asPromise()
        .then(
          response => {
            if(
              response.status !== 200 ||
              response.json.status !== 'OK'
            ) {
              if(
                response.status !== 200 ||
                response.json.status !== 'ZERO_RESULTS'
              ) {
                console.info('Geocode failed:', response)
              }

              return position.set(errVal)
            }

            return position.set({
              lat: response.json.results[0].geometry.location.lat,
              lng: response.json.results[0].geometry.location.lng,
              error: null,
            })
          },
          err => {
            console.error('Geocode error:', err)

            return position.set(errVal)
          }
        )
    })
